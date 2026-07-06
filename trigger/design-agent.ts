import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Liveblocks } from "@liveblocks/node";
import { mutateFlow } from "@liveblocks/react-flow/node";
import { logger, task } from "@trigger.dev/sdk";
import { generateObject } from "ai";
import { z } from "zod";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  DEFAULT_NODE_COLOR,
  NODE_COLORS,
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  type CanvasEdge,
  type CanvasNode,
  type NodeShape,
} from "@/types/canvas";
import { AI_ACTIVITY_EVENT, type AiActivityEvent } from "@/types/ai-activity";

export interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

// The room id is the project id, so the canvas lives in the room's default flow
// storage — exactly what `useLiveblocksFlow` reads on the client. `mutateFlow`
// writes into that same storage server-side, so every edit here syncs live to
// all connected clients through the existing collaborative flow (no bypass).

const NODE_FILLS = NODE_COLORS.map((color) => color.fill) as [
  string,
  ...string[],
];

// Flat action schema (rather than a discriminated union) so Gemini's structured
// output stays reliable. Each action carries only the fields its `type` needs.
const actionSchema = z.object({
  type: z.enum([
    "addNode",
    "moveNode",
    "resizeNode",
    "updateNodeData",
    "deleteNode",
    "addEdge",
    "deleteEdge",
  ]),
  id: z
    .string()
    .optional()
    .describe(
      "Stable node/edge id. Required for every addNode and for any action that targets an existing element. Reference these ids from addEdge source/target.",
    ),
  label: z.string().optional().describe("Node label text."),
  shape: z.enum(NODE_SHAPES).optional().describe("Node shape."),
  color: z.enum(NODE_FILLS).optional().describe("Node fill color (hex)."),
  x: z.number().optional().describe("Node x position (canvas coordinate)."),
  y: z.number().optional().describe("Node y position (canvas coordinate)."),
  width: z.number().optional(),
  height: z.number().optional(),
  source: z.string().optional().describe("addEdge: source node id."),
  target: z.string().optional().describe("addEdge: target node id."),
  edgeLabel: z.string().optional().describe("Optional edge label."),
});

const planSchema = z.object({
  summary: z
    .string()
    .describe("One short sentence describing what you built or changed."),
  actions: z.array(actionSchema),
});

type DesignAction = z.infer<typeof actionSchema>;

const SHAPE_GUIDE = [
  "rectangle — general-purpose component / service",
  "pill — process / API / stateless service",
  "cylinder — database / persistent storage / queue",
  "diamond — decision / gateway / router",
  "circle — event / endpoint / entry point",
  "hexagon — external system / third-party boundary",
].join("\n");

const SYSTEM_PROMPT = `You are Ghost AI, a system-design agent that draws architecture diagrams on a shared canvas.

You express the design as a list of canvas actions. Follow these rules exactly:

NODE SHAPES (pick the shape that matches each component's role):
${SHAPE_GUIDE}

COLOR PALETTE — use ONLY these fill hex values, and use color to group related components (e.g. all databases one color, all services another):
${NODE_FILLS.join(", ")}

LAYOUT & SPACING:
- Canvas coordinates: x grows right, y grows down. The origin (0,0) is fine as a starting point.
- Arrange the system in clear layers (e.g. clients/top → services/middle → data stores/bottom), flowing top-to-bottom or left-to-right.
- Space nodes at least 220px apart horizontally and 160px apart vertically. Never overlap nodes.
- Keep the whole diagram within roughly a 1400x900 area.

ACTIONS:
- addNode: assign a unique, descriptive "id" (e.g. "api-gateway"), set label, shape, color, x, y. Reuse these ids in edges.
- addEdge: set source and target to node ids. Add a short edgeLabel only when it clarifies the relationship (e.g. "reads", "publishes").
- moveNode / resizeNode / updateNodeData / deleteNode / deleteEdge: only when refining EXISTING elements (listed below). Use their existing ids.
- Prefer a focused design: usually 5–12 nodes. Connect every node so there are no isolated components.`;

function buildUserPrompt(
  prompt: string,
  nodes: readonly CanvasNode[],
  edges: readonly CanvasEdge[],
): string {
  if (nodes.length === 0 && edges.length === 0) {
    return `The canvas is currently empty. Design this system from scratch:\n\n${prompt}`;
  }

  const existing = {
    nodes: nodes.map((node) => ({
      id: node.id,
      label: node.data.label,
      shape: node.data.shape,
      position: node.position,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
    })),
  };

  return `Here is the current canvas (edit it — add to it or refine it, reusing existing ids where relevant):\n${JSON.stringify(
    existing,
  )}\n\nUser request:\n${prompt}`;
}

function createLiveblocksClient(): Liveblocks {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error("LIVEBLOCKS_SECRET_KEY is not set");
  }
  return new Liveblocks({ secret });
}

function createGeminiModel() {
  // `@ai-sdk/google` defaults to GOOGLE_GENERATIVE_AI_API_KEY; this project
  // stores the key as GOOGLE_AI_API_KEY, so pass it in explicitly.
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
  });
  // Latest stable (GA) Flash-tier model as of 2026-07.
  return google("gemini-3.5-flash");
}

export const designAgentTask = task({
  id: "design-agent",
  maxDuration: 300,
  run: async (payload: DesignAgentPayload, { ctx }) => {
    const { prompt, roomId } = payload;
    logger.log("design-agent starting", {
      promptLength: prompt.length,
      roomId,
      ctx,
    });

    const client = createLiveblocksClient();

    // Broadcast AI presence + status to every participant in the room.
    const broadcast = async (event: Omit<AiActivityEvent, "type">) => {
      try {
        await client.broadcastEvent(roomId, {
          type: AI_ACTIVITY_EVENT,
          ...event,
        });
      } catch (error) {
        // Never let a status broadcast failure break the run.
        logger.warn("design-agent broadcast failed", { error });
      }
    };

    try {
      await broadcast({
        status: "thinking",
        message: "Reading your prompt…",
        cursor: null,
      });

      // Read the current canvas so the model can extend / refine it. This
      // mutateFlow makes no changes, so it flushes a no-op.
      let currentNodes: CanvasNode[] = [];
      let currentEdges: CanvasEdge[] = [];
      await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
        currentNodes = [...flow.nodes];
        currentEdges = [...flow.edges];
      });

      const { object: plan } = await generateObject({
        model: createGeminiModel(),
        schema: planSchema,
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(prompt, currentNodes, currentEdges),
      });

      logger.log("design-agent plan", {
        summary: plan.summary,
        actionCount: plan.actions.length,
      });

      // Point the AI cursor at the first node it is about to place so its
      // presence is visible while the canvas fills in.
      const firstPlaced = plan.actions.find(
        (action) => action.type === "addNode",
      );
      await broadcast({
        status: "working",
        message: "Drawing your architecture…",
        cursor:
          firstPlaced && firstPlaced.x != null && firstPlaced.y != null
            ? { x: firstPlaced.x, y: firstPlaced.y }
            : null,
      });

      const applied = await applyActions(client, roomId, plan.actions);

      await broadcast({
        status: "done",
        message: plan.summary || "Design complete.",
        cursor: null,
      });

      logger.log("design-agent complete", { applied });
      return { ok: true as const, summary: plan.summary, applied };
    } catch (error) {
      logger.error("design-agent failed", { error });
      await broadcast({
        status: "error",
        message: "The AI could not complete this design. Please try again.",
        cursor: null,
      });
      // Swallow the error: rethrowing would retry the run and duplicate nodes
      // with fresh ids. Presence is already cleared by the error broadcast.
      return { ok: false as const };
    }
  },
});

async function applyActions(
  client: Liveblocks,
  roomId: string,
  actions: DesignAction[],
): Promise<number> {
  let applied = 0;

  await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId }, (flow) => {
    let counter = 0;

    // Track known node/edge ids across the whole pass (seeded from the
    // current flow, then updated as actions are applied) so we never save a
    // duplicate node id or an edge that references a node that doesn't exist
    // — either would produce a broken React Flow graph on the client.
    const nodeIds = new Set(flow.nodes.map((node) => node.id));
    const edgeIds = new Set(flow.edges.map((edge) => edge.id));

    for (const action of actions) {
      switch (action.type) {
        case "addNode": {
          const shape: NodeShape = action.shape ?? "rectangle";
          const size = SHAPE_DEFAULT_SIZES[shape];
          counter += 1;
          const id = action.id ?? `ai-node-${counter}`;
          if (nodeIds.has(id)) break; // duplicate id — skip
          flow.addNode({
            id,
            type: CANVAS_NODE_TYPE,
            position: { x: action.x ?? 0, y: action.y ?? 0 },
            data: {
              label: action.label ?? "",
              color: action.color ?? DEFAULT_NODE_COLOR,
              shape,
            },
            style: {
              width: action.width ?? size.width,
              height: action.height ?? size.height,
            },
          });
          nodeIds.add(id);
          applied += 1;
          break;
        }

        case "moveNode": {
          if (!action.id || action.x == null || action.y == null) break;
          flow.updateNode(action.id, {
            position: { x: action.x, y: action.y },
          });
          applied += 1;
          break;
        }

        case "resizeNode": {
          if (!action.id || action.width == null || action.height == null) {
            break;
          }
          flow.updateNode(action.id, (node) => ({
            ...node,
            style: {
              ...node.style,
              width: action.width,
              height: action.height,
            },
          }));
          applied += 1;
          break;
        }

        case "updateNodeData": {
          if (!action.id) break;
          const patch: Partial<CanvasNode["data"]> = {};
          if (action.label != null) patch.label = action.label;
          if (action.color != null) patch.color = action.color;
          if (action.shape != null) patch.shape = action.shape;
          if (Object.keys(patch).length === 0) break;
          flow.updateNodeData(action.id, patch);
          applied += 1;
          break;
        }

        case "deleteNode": {
          if (!action.id) break;
          // Cascade: drop edges attached to the removed node so no dangling
          // edges sync to clients (mirrors the client-side delete path).
          const orphanEdgeIds = flow.edges
            .filter(
              (edge) =>
                edge.source === action.id || edge.target === action.id,
            )
            .map((edge) => edge.id);
          if (orphanEdgeIds.length > 0) {
            flow.removeEdges(orphanEdgeIds);
            for (const edgeId of orphanEdgeIds) edgeIds.delete(edgeId);
          }
          flow.removeNode(action.id);
          nodeIds.delete(action.id);
          applied += 1;
          break;
        }

        case "addEdge": {
          if (!action.source || !action.target) break;
          // Skip edges that reference a node not known to exist (not on the
          // current flow and not added earlier in this pass).
          if (!nodeIds.has(action.source) || !nodeIds.has(action.target)) {
            break;
          }
          const id = action.id ?? `${action.source}->${action.target}`;
          if (edgeIds.has(id)) break; // duplicate edge id — skip
          flow.addEdge({
            id,
            type: CANVAS_EDGE_TYPE,
            source: action.source,
            target: action.target,
            data: action.edgeLabel ? { label: action.edgeLabel } : {},
          });
          edgeIds.add(id);
          applied += 1;
          break;
        }

        case "deleteEdge": {
          if (!action.id) break;
          flow.removeEdge(action.id);
          edgeIds.delete(action.id);
          applied += 1;
          break;
        }
      }
    }
  });

  return applied;
}
