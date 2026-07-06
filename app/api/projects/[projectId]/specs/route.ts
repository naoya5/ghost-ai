import { prisma } from "@/lib/prisma";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

// GET — list the generated specs for a project (metadata only).
// The Markdown content stays in Vercel Blob and is served by the sibling
// `[specId]/download` route; this endpoint never exposes the blob path. Same
// access ladder as the download/canvas routes: owner or collaborator only, and
// a missing project returns 404 without leaking its existence.
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

  const specs = await prisma.projectSpec.findMany({
    where: { projectId },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  // filePath (the private blob URL) is intentionally omitted — the client only
  // needs the id (to hit the download route) and metadata for the list.
  return Response.json({
    specs: specs.map((spec) => ({
      id: spec.id,
      filename: `spec-${spec.id}.md`,
      createdAt: spec.createdAt.toISOString(),
    })),
  });
}
