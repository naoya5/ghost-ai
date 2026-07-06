import { get } from "@vercel/blob";

import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string; specId: string }>;
}

// GET — download a generated spec as a Markdown attachment.
// Validates the caller, their access to the project, and that the spec belongs
// to that project before fetching the file from Vercel Blob. The blob is
// private, so it is read through `get` (authenticated with the read-write
// token) rather than by exposing the blob URL to the client.
export async function GET(_request: Request, { params }: RouteContext) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;

  // Owner or collaborator only; `null` also covers a missing project, so we
  // return 404 without leaking whether the project exists (matches the canvas
  // and collaborators routes).
  const access = await getProjectAccess(projectId, identity);
  if (!access) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const spec = await prisma.projectSpec.findUnique({
    where: { id: specId },
    select: { projectId: true, filePath: true },
  });

  // Not found, or the spec belongs to a different project — either way, 404.
  if (!spec || spec.projectId !== projectId) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  const stored = await get(spec.filePath, { access: "private" });
  if (!stored || stored.statusCode !== 200) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }

  return new Response(stored.stream, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="spec-${specId}.md"`,
    },
  });
}
