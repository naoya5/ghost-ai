import { auth as triggerAuth, tasks } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { parseDesignRequest } from "@/lib/api/ai-payload";
import { readJsonBody } from "@/lib/api/project-payload";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import type { designAgentTask } from "@/trigger/design-agent";

// POST — kick off a design generation run.
// Triggers the Trigger.dev design task, records a TaskRun for ownership checks,
// and returns the run ID so the client can subscribe with a scoped token.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = parseDesignRequest(await readJsonBody(request));
  if (!parsed) {
    return Response.json(
      { error: "prompt, roomId, and projectId are required" },
      { status: 400 },
    );
  }

  const { prompt, roomId, projectId } = parsed;

  // Only owners / collaborators of the project may trigger a design run.
  // `null` covers both "missing project" and "no access" (never leak existence).
  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  // Trigger by id (with the task's type for payload safety) so this route does
  // not bundle the task implementation.
  const handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
    prompt,
    roomId,
  });

  // Create the ownership record and mint the scoped token together. If either
  // step fails after the run was triggered, report a 500 rather than a
  // partial 201 — the client must never think it can subscribe without a
  // token in hand.
  try {
    await prisma.taskRun.create({
      data: {
        runId: handle.id,
        projectId,
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
      { error: "Failed to finish starting the design run" },
      { status: 500 },
    );
  }
}
