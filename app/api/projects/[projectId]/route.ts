import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { parseProjectName, readJsonBody } from "@/lib/api/project-payload";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
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

  const body = await readJsonBody(request);
  const name = parseProjectName(body);
  if (!name) {
    return Response.json(
      { error: "name is required" },
      { status: 400 },
    );
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { name },
  });

  return Response.json({ project });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
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

  await prisma.project.delete({ where: { id: projectId } });
  return new Response(null, { status: 204 });
}
