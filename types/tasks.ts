import { z } from "zod";

// Payload schema for the shared `ai-status-feed` Liveblocks feed.
//
// The feed carries the most recent AI activity status so every participant in
// the room sees the same "AI is working" signal. It is kept intentionally
// generic — only an optional human-readable `text` — so design *and* spec
// generation can both reuse it later. Messages read off the wire (Storage or a
// remote peer) are validated with `parseAiStatusMessage` before display.

// The Liveblocks Storage key the feed lives under. Reused by the config typing,
// the read/write hook, and `initialStorage`.
export const AI_STATUS_FEED = "ai-status-feed" as const;

export type AiStatusMessage = {
  // Human-readable status line, e.g. "Ghost AI is designing your architecture…".
  text?: string;
};

// Validate an unknown value into an `AiStatusMessage`, or `null` when it is
// absent / malformed. A non-null return means AI activity is currently active
// in the room; `null` means idle. Only `text` is accepted, and only when it is
// a string — anything else is rejected so bad payloads never render.
export function parseAiStatusMessage(value: unknown): AiStatusMessage | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return null;
  const text = (value as { text?: unknown }).text;
  if (text !== undefined && typeof text !== "string") return null;
  return text === undefined ? {} : { text };
}

// Payload schema for the collaborative `ai-chat` Liveblocks feed.
//
// This is intentionally kept separate from `ai-status-feed`: `ai-chat` carries
// human-to-human room chat messages (an ordered, growing log), while
// `ai-status-feed` carries the single latest AI activity status. Every message
// read off Storage is validated with `parseChatMessage` before it is rendered.

// The Liveblocks Storage key the chat feed lives under. Reused by the config
// typing, the read/write hook, and `initialStorage`.
export const AI_CHAT_FEED = "ai-chat" as const;

// Message role. Only `user` messages are sent for now (no AI replies yet), but
// the schema stays forward-compatible with an `assistant` role.
export const chatRoleSchema = z.enum(["user", "assistant"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

// A single chat message. `id` gives React a stable key and dedup handle;
// `timestamp` is epoch milliseconds. All fields are plain JSON so the message
// is LSON-serializable inside a Liveblocks `LiveList`.
export const chatMessageSchema = z.object({
  id: z.string().min(1),
  sender: z.string().min(1),
  role: chatRoleSchema,
  content: z.string().min(1),
  timestamp: z.number().int().nonnegative(),
});
export type ChatFeedMessage = z.infer<typeof chatMessageSchema>;

// Validate an unknown value into a `ChatFeedMessage`, or `null` when it is
// malformed. Malformed messages are dropped rather than rendered.
export function parseChatMessage(value: unknown): ChatFeedMessage | null {
  const result = chatMessageSchema.safeParse(value);
  return result.success ? result.data : null;
}
