"use client";

import { useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";
import { useViewport } from "@xyflow/react";
import { Loader2Icon } from "lucide-react";

// Live cursors for other participants. Cursor positions are stored in React
// Flow coordinates (see the broadcast in flow-canvas.tsx), so we project them
// back through the current viewport transform to keep each pointer pinned to
// the same canvas point regardless of this viewer's pan/zoom. `useViewport`
// re-renders this layer whenever the viewport changes.
export function LiveCursors() {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const others = useOthers();
  const { x, y, zoom } = useViewport();

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {others.map((other) => {
        const cursor = other.presence.cursor;
        // Render other participants only, never the current user (a person
        // connected from multiple tabs shares the same Clerk id).
        if (!cursor || (other.id && other.id === currentUserId)) return null;

        const left = cursor.x * zoom + x;
        const top = cursor.y * zoom + y;
        return (
          <Cursor
            key={other.connectionId}
            left={left}
            top={top}
            color={other.info?.color ?? "#808090"}
            name={other.info?.name ?? "Guest"}
            thinking={other.presence.thinking === true}
          />
        );
      })}
    </div>
  );
}

interface CursorProps {
  left: number;
  top: number;
  color: string;
  name: string;
  thinking: boolean;
}

function Cursor({ left, top, color, name, thinking }: CursorProps) {
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
          fill={color}
          stroke="#080809"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className="absolute left-4 top-4 flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white shadow-md"
        style={{ backgroundColor: color }}
      >
        {thinking ? (
          <Loader2Icon className="h-2.5 w-2.5 animate-spin" />
        ) : null}
        {name}
      </span>
    </div>
  );
}
