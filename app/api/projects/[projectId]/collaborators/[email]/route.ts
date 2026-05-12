import { auth } from "@clerk/nextjs/server";

import { normalizeCollaboratorEmail } from "@/lib/api/collaborator-payload";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string; email: string }>;
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, email: rawEmail } = await params;
  let decodedEmail: string;
  try {
    decodedEmail = decodeURIComponent(rawEmail);
  } catch {
    return Response.json(
      { error: "valid email is required" },
      { status: 400 },
    );
  }
  const email = normalizeCollaboratorEmail(decodedEmail);
  if (!email) {
    return Response.json(
      { error: "valid email is required" },
      { status: 400 },
    );
  }

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!existing) {
    return Response.json({ error: "Not Found" }, { status: 404 });
  }
  if (existing.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.projectCollaborator.deleteMany({
    where: { projectId, email },
  });

  return new Response(null, { status: 204 });
}
