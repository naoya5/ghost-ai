// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { AiActivityEvent } from "@/types/ai-activity";
import type { AiStatusMessage } from "@/types/tasks";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      cursor: { x: number; y: number } | null;
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    // `ai-status-feed` holds the most recent shared AI activity status (or null
    // when idle) so every participant sees the same "AI is working" signal.
    // See `types/tasks.ts` and `hooks/useAiStatusFeed.ts`. (The React Flow
    // diagram is stored by `@liveblocks/react-flow` under its own `flow` key,
    // which it manages internally and does not surface on this interface.)
    Storage: {
      "ai-status-feed": AiStatusMessage | null;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        name: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener.
    // The AI design agent broadcasts its presence + status feed over this
    // channel (see `trigger/design-agent.ts` and `ai-activity-layer.tsx`).
    RoomEvent: AiActivityEvent;

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: Record<string, never>;

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: Record<string, never>;
  }
}

export {};
