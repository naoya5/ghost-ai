import { currentUser } from "@clerk/nextjs/server";

import { readJsonBody } from "@/lib/api/project-payload";
import { getCursorColor } from "@/lib/cursor-color";
import { getLiveblocks } from "@/lib/liveblocks";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

function parseRoom(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  if (!("room" in body)) return undefined;
  const raw = (body as { room: unknown }).room;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function POST(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readJsonBody(request);
  const room = parseRoom(body);
  if (!room) {
    return Response.json({ error: "room is required" }, { status: 400 });
  }

  const access = await getProjectAccess(room, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocks();
  await liveblocks.getOrCreateRoom(room, { defaultAccesses: [] });

  const user = await currentUser();
  const name =
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    identity.email ||
    identity.userId;
  const avatar = user?.imageUrl ?? "";
  const color = getCursorColor(identity.userId);

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: { name, avatar, color },
  });
  session.allow(room, session.FULL_ACCESS);

  const { status, body: token } = await session.authorize();
  return new Response(token, { status });
}
