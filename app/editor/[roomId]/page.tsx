import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
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

  return (
    <main className="flex flex-1 items-center justify-center bg-base px-6 text-center">
      <div className="max-w-md space-y-2">
        <p className="text-sm uppercase tracking-wide text-copy-faint">
          Workspace
        </p>
        <h1 className="text-xl font-medium text-copy-primary">
          {access.project.name}
        </h1>
        <p className="text-sm text-copy-muted">
          Canvas coming soon. Real-time collaboration will appear here.
        </p>
      </div>
    </main>
  );
}
