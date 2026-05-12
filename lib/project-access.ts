import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import type { ProjectOwnership } from "@/types/project";

export interface Identity {
  userId: string;
  email: string | null;
}

export async function getCurrentIdentity(): Promise<Identity | null> {
  const { userId } = await auth();
  if (!userId) {
    return null;
  }
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  return { userId, email };
}

export interface ProjectAccess {
  project: {
    id: string;
    name: string;
  };
  ownership: ProjectOwnership;
}

export async function getProjectAccess(
  projectId: string,
  identity: Identity,
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });

  if (!project) {
    return null;
  }

  if (project.ownerId === identity.userId) {
    return {
      project: { id: project.id, name: project.name },
      ownership: "owner",
    };
  }

  if (identity.email) {
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: {
          projectId: project.id,
          email: identity.email,
        },
      },
      select: { email: true },
    });
    if (collaborator) {
      return {
        project: { id: project.id, name: project.name },
        ownership: "collaborator",
      };
    }
  }

  return null;
}
