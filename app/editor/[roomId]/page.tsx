import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { CanvasRoom } from "@/components/editor/canvas/canvas-room";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";

interface EditorRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    redirect("/sign-in");
  }

  const { roomId } = await params;
  const access = await getProjectAccess(roomId, identity);

  if (!access) {
    return <AccessDenied />;
  }

  return <CanvasRoom roomId={roomId} />;
}
