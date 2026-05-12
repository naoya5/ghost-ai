import { auth } from "@clerk/nextjs/server";

import {
  parseCollaboratorEmail,
} from "@/lib/api/collaborator-payload";
import { readJsonBody } from "@/lib/api/project-payload";
import {
  getCurrentIdentity,
  getProjectAccess,
} from "@/lib/project-access";
import { listCollaboratorsForProject } from "@/lib/collaborators";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

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

  const collaborators = await listCollaboratorsForProject(projectId);
  return Response.json({ collaborators, ownership: access.ownership });
}

export async function POST(request: Request, { params }: RouteContext) {
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
  const email = parseCollaboratorEmail(body);
  if (!email) {
    return Response.json(
      { error: "valid email is required" },
      { status: 400 },
    );
  }

  await prisma.projectCollaborator.upsert({
    where: { projectId_email: { projectId, email } },
    update: {},
    create: { projectId, email },
  });

  const collaborators = await listCollaboratorsForProject(projectId);
  return Response.json({ collaborators }, { status: 201 });
}
