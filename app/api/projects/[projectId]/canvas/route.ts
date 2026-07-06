import { get, put } from "@vercel/blob";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { readJsonBody } from "@/lib/api/project-payload";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

// Boundary shape for the saved canvas: just the two React Flow arrays. Element
// shape is intentionally left loose (`z.unknown()`) — this only guards against
// a malformed/non-canvas body, not a full re-validation of node/edge schema.
const canvasBodySchema = z.object({
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
});

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

// PUT — persist the latest canvas JSON.
// Uploads the JSON to Vercel Blob and stores the returned URL on the project.
export async function PUT(request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const body = await readJsonBody(request);
  const parsed = canvasBodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "canvas is required" }, { status: 400 });
  }
  const canvas = parsed.data;

  const blob = await put(`canvas/${projectId}.json`, JSON.stringify(canvas), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { canvasJsonPath: blob.url },
  });

  return Response.json({ url: blob.url });
}

// GET — return the saved canvas JSON for the editor to load.
// Reads the blob URL from Prisma, then fetches the canvas state from Vercel Blob.
export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project?.canvasJsonPath) {
    return Response.json({ canvas: null });
  }

  // Retrieve the stored canvas from Vercel Blob via the SDK. The blob is
  // private, so we read it through `get` (authenticated with the read-write
  // token) rather than fetching the URL directly.
  const stored = await get(project.canvasJsonPath, { access: "private" });
  if (!stored || stored.statusCode !== 200) {
    return Response.json({ canvas: null });
  }

  const canvas = await new Response(stored.stream).json();
  return Response.json({ canvas });
}
