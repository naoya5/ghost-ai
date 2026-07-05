"use client";

import { useEffect, useRef, useState } from "react";

import { useEventListener } from "@liveblocks/react/suspense";
import { useViewport } from "@xyflow/react";
import {
  AlertCircleIcon,
  BotIcon,
  CheckIcon,
  Loader2Icon,
} from "lucide-react";

import type { AiActivityEvent } from "@/types/ai-activity";
import { cn } from "@/lib/utils";

// Renders the AI design agent's presence + status feed for every participant.
// The Trigger.dev task broadcasts `ai-activity` room events (see
// `trigger/design-agent.ts`); this layer lives inside <ReactFlow> so it can
// project the AI cursor through the current viewport, exactly like LiveCursors.
export function AiActivityLayer() {
  const [activity, setActivity] = useState<AiActivityEvent | null>(null);
  const { x, y, zoom } = useViewport();
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEventListener(({ event }) => {
    setActivity(event);
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    // Terminal states linger briefly, then clear so the canvas is unobstructed.
    if (event.status === "done" || event.status === "error") {
      dismissTimer.current = setTimeout(() => setActivity(null), 4000);
    }
  });

  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  if (!activity) return null;

  const isActive =
    activity.status === "thinking" || activity.status === "working";
  const showCursor = isActive && activity.cursor !== null;

  return (
    <>
      <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2">
        <StatusBanner activity={activity} />
      </div>
      {showCursor && activity.cursor ? (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <AiCursor
            left={activity.cursor.x * zoom + x}
            top={activity.cursor.y * zoom + y}
          />
        </div>
      ) : null}
    </>
  );
}

function StatusBanner({ activity }: { activity: AiActivityEvent }) {
  const { status, message } = activity;

  const icon =
    status === "working" ? (
      <Loader2Icon className="h-4 w-4 animate-spin text-accent-ai-text" />
    ) : status === "done" ? (
      <CheckIcon className="h-4 w-4 text-state-success" />
    ) : status === "error" ? (
      <AlertCircleIcon className="h-4 w-4 text-state-error" />
    ) : (
      <BotIcon className="h-4 w-4 animate-pulse text-accent-ai-text" />
    );

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 rounded-full border bg-surface/95 px-3.5 py-1.5 text-xs font-medium shadow-2xl backdrop-blur-sm",
        status === "error"
          ? "border-state-error/40 text-state-error"
          : status === "done"
            ? "border-state-success/40 text-copy-secondary"
            : "border-accent-ai/40 text-accent-ai-text",
      )}
    >
      {icon}
      <span className="max-w-[22rem] truncate">{message}</span>
    </div>
  );
}

function AiCursor({ left, top }: { left: number; top: number }) {
  return (
    <div
      className="absolute left-0 top-0 will-change-transform"
      style={{ transform: `translate(${left}px, ${top}px)` }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <path
          d="M2 2 L2 16 L6 12 L9 18 L11 17 L8 11 L15 11 Z"
          fill="#6457f9"
          stroke="#080809"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span className="absolute left-4 top-4 flex items-center gap-1 whitespace-nowrap rounded-md bg-accent-ai px-1.5 py-0.5 text-[10px] font-medium text-white shadow-md">
        <BotIcon className="h-3 w-3" />
        Ghost AI
      </span>
    </div>
  );
}
