import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { parseSpecRequest } from "@/lib/api/ai-payload";
import { readJsonBody } from "@/lib/api/project-payload";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import type { generateSpec } from "@/trigger/generate-spec";

// POST — kick off a spec generation run.
// Triggers the Trigger.dev `generate-spec` task, records a TaskRun for ownership
// checks, and returns the run ID so the client can subscribe with a scoped token.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = parseSpecRequest(await readJsonBody(request));
  if (!parsed) {
    return Response.json(
      { error: "roomId, chatHistory, nodes, and edges are required" },
      { status: 400 },
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsed;

  // Resolve project access from the authenticated user + roomId. The trusted
  // projectId comes from this lookup — never from the request body. `null`
  // covers both "missing project" and "no access" (never leak existence).
  const access = await getProjectAccess(roomId, identity);
  if (!access) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  // Trigger by id (with the task's type for payload safety) so this route does
  // not bundle the task implementation.
  const handle = await tasks.trigger<typeof generateSpec>("generate-spec", {
    projectId: access.project.id,
    roomId,
    chatHistory,
    nodes,
    edges,
  });

  // Create the ownership record and mint the scoped token together. If either
  // step fails after the run was triggered, the run itself is orphaned (the
  // client never learns its id), but that's the same failure mode as before —
  // what we must avoid is a client that thinks it succeeded but has no token
  // to subscribe with. Report a 500 in that case instead of a partial 201.
  try {
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId: access.project.id,
        userId: identity.userId,
      },
    });

    const publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [handle.id],
        },
      },
      expirationTime: "1h",
    });

    return Response.json(
      { runId: handle.id, publicToken },
      { status: 201 },
    );
  } catch {
    return Response.json(
      { error: "Failed to finish starting the spec run" },
      { status: 500 },
    );
  }
}
