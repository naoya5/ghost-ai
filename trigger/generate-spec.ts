import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { put } from "@vercel/blob";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

// Input validation. The trigger route has already authenticated the caller and
// resolved project access, but the task revalidates its own payload with Zod so
// it never trusts a malformed shape (canvas/chat data originates on the client).
// Schemas are intentionally lenient (`passthrough`, optional fields) — the task
// only reads a few fields to build the prompt, and dropping unknown extras keeps
// it resilient to canvas/chat schema drift.

const chatMessageInputSchema = z
  .object({
    role: z.string().optional(),
    content: z.string().optional(),
  })
  .passthrough();

const nodeInputSchema = z
  .object({
    id: z.string().optional(),
    data: z
      .object({
        label: z.string().optional(),
        shape: z.string().optional(),
      })
      .passthrough()
      .optional(),
    position: z
      .object({ x: z.number().optional(), y: z.number().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

const edgeInputSchema = z
  .object({
    id: z.string().optional(),
    source: z.string().optional(),
    target: z.string().optional(),
    data: z
      .object({ label: z.string().optional() })
      .passthrough()
      .optional(),
  })
  .passthrough();

const specPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(chatMessageInputSchema),
  nodes: z.array(nodeInputSchema),
  edges: z.array(edgeInputSchema),
});

// The trigger route validates only `roomId` and that the array fields are
// arrays, forwarding their contents untyped. The task revalidates each element
// with `specPayloadSchema`, so the run payload takes the loose boundary shape.
export interface GenerateSpecPayload {
  projectId: string;
  roomId: string;
  chatHistory: unknown[];
  nodes: unknown[];
  edges: unknown[];
}

type SpecInput = z.infer<typeof specPayloadSchema>;

const SYSTEM_PROMPT = `You are Ghost AI, a senior software architect. You write clear, well-structured technical specifications in Markdown.

You are given a system-design canvas (nodes and edges representing components and their relationships) and the chat conversation that led to it. Produce a technical specification document that a team could hand to engineers to start building.

Rules:
- Output GitHub-flavored Markdown ONLY. No preamble, no code fences around the whole document, no closing commentary.
- Start with a single top-level "# " title.
- Include these sections when the input supports them: Overview, Architecture (describe each component from the nodes and how they connect from the edges), Data Flow, Key Components, APIs / Interfaces, Data Model, Non-Functional Requirements, and Open Questions.
- Ground every claim in the provided canvas and chat. Do not invent components that are not implied by the input. If information is missing, list it under Open Questions instead of guessing.
- Be concise and concrete. Prefer bullet lists and short paragraphs over prose walls.`;

function createGeminiModel() {
  // `@ai-sdk/google` defaults to GOOGLE_GENERATIVE_AI_API_KEY; this project
  // stores the key as GOOGLE_AI_API_KEY, so pass it in explicitly (mirrors
  // `trigger/design-agent.ts`).
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });
  // Latest stable (GA) Flash-tier model as of 2026-07.
  return google("gemini-3.5-flash");
}

function buildUserPrompt(input: SpecInput): string {
  const canvas = {
    nodes: input.nodes.map((node) => ({
      id: node.id,
      label: node.data?.label,
      shape: node.data?.shape,
    })),
    edges: input.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      label: edge.data?.label,
    })),
  };

  const chat = input.chatHistory
    .map((message) => `${message.role ?? "user"}: ${message.content ?? ""}`)
    .join("\n");

  return [
    "SYSTEM-DESIGN CANVAS (JSON):",
    JSON.stringify(canvas),
    "",
    "CHAT CONVERSATION:",
    chat.length > 0 ? chat : "(no conversation was recorded)",
    "",
    "Write the technical specification as Markdown now.",
  ].join("\n");
}

export const generateSpec = task({
  id: "generate-spec",
  maxDuration: 300,
  run: async (payload: GenerateSpecPayload) => {
    // Revalidate the payload inside the task boundary.
    const input = specPayloadSchema.parse(payload);
    const { projectId, roomId } = input;

    logger.log("generate-spec starting", {
      projectId,
      roomId,
      nodeCount: input.nodes.length,
      edgeCount: input.edges.length,
      chatCount: input.chatHistory.length,
    });

    // Realtime status for the client (via `useRealtimeRun` -> run.metadata).
    metadata.set("status", "generating");
    metadata.set("message", "Writing your technical spec…");

    try {
      const { text } = await generateText({
        model: createGeminiModel(),
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(input),
      });

      const spec = text.trim();

      // Persist the spec: metadata row in Postgres, Markdown content in Vercel
      // Blob (mirrors the canvas metadata+blob storage model). Create the row
      // first so the blob path can key off its id (`specs/{projectId}/{specId}.md`),
      // then upload and store the blob URL on `filePath`.
      const record = await prisma.projectSpec.create({
        data: { projectId, filePath: "" },
      });

      // If the blob upload or the follow-up update fails, delete the
      // provisional row rather than leaving a `filePath: ""` record behind —
      // that would show up in the specs list with a 404 download. This also
      // makes the whole create -> upload -> update sequence self-cleaning, so
      // a Trigger.dev retry after a failure here starts clean instead of
      // orphaning rows or blobs (see the retry note below).
      try {
        const blob = await put(`specs/${projectId}/${record.id}.md`, spec, {
          access: "private",
          contentType: "text/markdown",
          addRandomSuffix: false,
          allowOverwrite: true,
        });

        await prisma.projectSpec.update({
          where: { id: record.id },
          data: { filePath: blob.url },
        });
      } catch (persistError) {
        await prisma.projectSpec
          .delete({ where: { id: record.id } })
          .catch(() => {
            // Best-effort cleanup; if this also fails there's nothing more we
            // can do here, so surface the original error below.
          });
        throw persistError;
      }

      metadata.set("status", "completed");
      metadata.set("message", "Spec ready.");
      metadata.set("specId", record.id);
      logger.log("generate-spec complete", {
        specId: record.id,
        specLength: spec.length,
      });

      // Task output is plain Markdown.
      return spec;
    } catch (error) {
      logger.error("generate-spec failed", { error });
      metadata.set("status", "error");
      metadata.set("message", "Spec generation failed.");
      // Rethrow so the run is marked FAILED for realtime tracking. A failure
      // during `generateText` has no side effects yet, and a failure during
      // the create -> upload -> update sequence above is cleaned up (the
      // provisional `projectSpec` row is deleted before the rethrow), so a
      // Trigger.dev retry never finds a partial/duplicate spec to build on.
      throw error;
    }
  },
});
