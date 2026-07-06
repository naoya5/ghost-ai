"use client";

import { LiveList } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react/suspense";

import { parseChatMessage, type ChatFeedMessage } from "@/types/tasks";

// Read/write access to the collaborative `ai-chat` Liveblocks Storage feed.
//
// The feed is an ordered `LiveList<ChatFeedMessage>` so concurrent sends from
// different participants append without overwriting one another. It is kept
// separate from `ai-status-feed` (AI progress/presence). Every stored message
// is validated with `parseChatMessage` before it is returned, so malformed
// payloads never reach the UI. Must be called inside the Liveblocks room (it is
// — the AI sidebar is mounted within the canvas room).
export function useAiChatFeed() {
  const raw = useStorage((root) => root["ai-chat"]);

  // Validate each message and drop any that fail; the list stays ordered.
  const messages: ChatFeedMessage[] = (raw ?? [])
    .map(parseChatMessage)
    .filter((message): message is ChatFeedMessage => message !== null);

  const send = useMutation(({ storage }, message: ChatFeedMessage) => {
    const list = storage.get("ai-chat");
    // Pre-existing rooms (created before this feed existed) have no `ai-chat`
    // key; initialize it lazily on first send. New rooms get it via
    // `initialStorage`, so `list` is normally already present.
    if (!list) {
      storage.set("ai-chat", new LiveList([message]));
      return;
    }
    list.push(message);
  }, []);

  return {
    // Validated chat messages, oldest first.
    messages,
    // Append a message to the shared feed.
    send,
  };
}
