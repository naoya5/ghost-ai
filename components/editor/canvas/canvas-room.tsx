"use client";

import { LiveList } from "@liveblocks/client";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";

import { CanvasErrorBoundary } from "./canvas-error-boundary";
import { FlowCanvas } from "./flow-canvas";

function CanvasLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base text-sm text-copy-muted">
      Loading canvas…
    </div>
  );
}

function CanvasError() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-base px-6 text-center text-sm text-copy-muted">
      Could not connect to the collaborative canvas. Refresh the page to try
      again.
    </div>
  );
}

interface CanvasRoomProps {
  roomId: string;
}

export function CanvasRoom({ roomId }: CanvasRoomProps) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{ cursor: null, thinking: false }}
        initialStorage={{ "ai-status-feed": null, "ai-chat": new LiveList([]) }}
      >
        <CanvasErrorBoundary fallback={<CanvasError />}>
          <ClientSideSuspense fallback={<CanvasLoading />}>
            <FlowCanvas />
          </ClientSideSuspense>
        </CanvasErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
