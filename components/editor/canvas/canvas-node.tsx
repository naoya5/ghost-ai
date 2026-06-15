"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";

import { getNodeColorPair, type CanvasNode } from "@/types/canvas";

const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  const { fill, text } = getNodeColorPair(data.color);

  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-md border px-3 py-2 text-center text-sm"
      style={{
        backgroundColor: fill,
        color: text,
        borderColor: selected ? text : "var(--border-subtle)",
      }}
    >
      {HANDLE_POSITIONS.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          className="!h-2 !w-2 !border !border-surface-border !bg-copy-primary opacity-0 transition-opacity hover:opacity-100"
        />
      ))}
      <span className="line-clamp-3 break-words">{data.label}</span>
    </div>
  );
}
