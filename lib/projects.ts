import "server-only";

import { prisma } from "@/lib/prisma";
import type { Project } from "@/types/project";

export interface ProjectLists {
  owned: Project[];
  shared: Project[];
}

interface ProjectRecord {
  id: string;
  name: string;
}

function toUiProject(
  record: ProjectRecord,
  ownership: Project["ownership"],
): Project {
  return {
    id: record.id,
    name: record.name,
    slug: record.id,
    ownership,
  };
}

export async function getProjectsForUser(
  userId: string,
  userEmail: string | null,
): Promise<ProjectLists> {
  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    }),
    userEmail
      ? prisma.project.findMany({
          where: {
            ownerId: { not: userId },
            collaborators: { some: { email: userEmail } },
          },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        })
      : Promise.resolve<ProjectRecord[]>([]),
  ]);

  return {
    owned: owned.map((record) => toUiProject(record, "owner")),
    shared: shared.map((record) => toUiProject(record, "collaborator")),
  };
}
