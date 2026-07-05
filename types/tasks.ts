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
