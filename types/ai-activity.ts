// Shared shape for the AI design agent's presence + status feed.
//
// The Trigger.dev task (server-side) broadcasts these over the Liveblocks room
// event channel; every connected client renders them (status banner + a ghost
// AI cursor) so AI presence and progress are visible to all participants. This
// is the "AI presence (cursor + thinking state)" and "shared status feed" the
// design-agent spec calls for, expressed entirely inside Liveblocks — no new
// state system.

export const AI_ACTIVITY_EVENT = "ai-activity" as const;

export type AiActivityStatus = "thinking" | "working" | "done" | "error";

export type AiActivityEvent = {
  type: typeof AI_ACTIVITY_EVENT;
  // Coarse phase of the run, drives the banner styling and cursor visibility.
  status: AiActivityStatus;
  // Human-readable progress line shown in the status banner.
  message: string;
  // AI "cursor" position in React Flow coordinates (same space as user cursors
  // in `Presence.cursor`), or `null` when the agent is not pointing anywhere.
  cursor: { x: number; y: number } | null;
};
