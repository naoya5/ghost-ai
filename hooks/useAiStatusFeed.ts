"use client";

import { useMutation, useStorage } from "@liveblocks/react/suspense";

import {
  parseAiStatusMessage,
  type AiStatusMessage,
} from "@/types/tasks";

// Read/write access to the shared `ai-status-feed` Liveblocks Storage entry.
//
// Storage is used (rather than an ephemeral broadcast) so the latest status
// persists in the room: a participant joining mid-generation still sees that AI
// is active. Consumers get the validated latest message, a derived `isActive`
// flag driving the shared "generation in progress" UI, and `publish` to set or
// clear the feed. Must be called inside the Liveblocks room (it is — the AI
// sidebar is mounted within the canvas room).
export function useAiStatusFeed() {
  const raw = useStorage((root) => root["ai-status-feed"]);
  const message = parseAiStatusMessage(raw);

  const publish = useMutation(
    ({ storage }, next: AiStatusMessage | null) => {
      storage.set("ai-status-feed", next);
    },
    [],
  );

  return {
    // Latest validated status message, or null when idle.
    message,
    // Whether AI activity is currently active anywhere in the room.
    isActive: message !== null,
    // Set (`{ text }`) or clear (`null`) the shared status.
    publish,
  };
}
