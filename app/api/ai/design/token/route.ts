import { auth as triggerAuth } from "@trigger.dev/sdk";

import { prisma } from "@/lib/prisma";
import { parseRunId } from "@/lib/api/ai-payload";
import { readJsonBody } from "@/lib/api/project-payload";
import { getCurrentIdentity } from "@/lib/project-access";

// POST — issue a Trigger.dev public token scoped to a single run.
// Ownership is verified against the TaskRun record so a token is only ever
// minted for a run the caller started.
export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runId = parseRunId(await readJsonBody(request));
  if (!runId) {
    return Response.json({ error: "runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findUnique({
    where: { runId },
    select: { userId: true },
  });
  if (!taskRun) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  if (taskRun.userId !== identity.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = await triggerAuth.createPublicToken({
    scopes: {
      read: {
        runs: [runId],
      },
    },
    expirationTime: "1h",
  });

  return Response.json({ token });
}
