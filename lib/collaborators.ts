import "server-only";

import { lookupClerkUsersByEmail } from "@/lib/clerk-users";
import { prisma } from "@/lib/prisma";
import type { Collaborator } from "@/types/collaborator";

export async function listCollaboratorsForProject(
  projectId: string,
): Promise<Collaborator[]> {
  const rows = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { email: true, createdAt: true },
  });

  const userMap = await lookupClerkUsersByEmail(rows.map((row) => row.email));

  return rows.map((row) => {
    const summary = userMap.get(row.email);
    return {
      email: row.email,
      displayName: summary?.displayName ?? null,
      imageUrl: summary?.imageUrl ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  });
}
