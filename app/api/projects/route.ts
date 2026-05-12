import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import {
  parseProjectDescription,
  parseProjectId,
  parseProjectName,
  readJsonBody,
} from "@/lib/api/project-payload";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  const id = parseProjectId(body);
  const name = parseProjectName(body) ?? "Untitled Project";
  const description = parseProjectDescription(body);

  const project = await prisma.project.create({
    data: {
      ownerId: userId,
      name,
      ...(id ? { id } : {}),
      ...(description ? { description } : {}),
    },
  });

  return Response.json({ project }, { status: 201 });
}
