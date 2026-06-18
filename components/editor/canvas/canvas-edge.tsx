"use client";

import { useCallback, useRef, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import { type CanvasEdge } from "@/types/canvas";

export function CanvasEdgeRenderer({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const { updateEdgeData } = useReactFlow();
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const label = data?.label ?? "";
  const isActive = selected || hovered;

  const edgeStroke = isActive ? "#f0f0f4" : "#808090";
  const edgeOpacity = isActive ? 1 : 0.55;

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditing(true);
      // Focus the input on next tick after render
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    },
    [],
  );

  const commitLabel = useCallback(
    (value: string) => {
      updateEdgeData(id, { label: value });
    },
    [id, updateEdgeData],
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      commitLabel(e.target.value);
      setEditing(false);
    },
    [commitLabel],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Enter" || e.key === "Escape") {
        commitLabel((e.target as HTMLInputElement).value);
        setEditing(false);
      }
    },
    [commitLabel],
  );

  const handleLabelMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleLabelPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={20}
        style={{
          stroke: edgeStroke,
          strokeWidth: 1.5,
          strokeLinecap: "round",
          opacity: edgeOpacity,
          transition: "stroke 0.15s ease, opacity 0.15s ease",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleLabelMouseDown}
          onPointerDown={handleLabelPointerDown}
        >
          {editing ? (
            <input
              ref={inputRef}
              defaultValue={label}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="nodrag nopan rounded-full border border-[#3a3a42] bg-[#18181c] px-2 py-0.5 text-center text-xs text-[#f0f0f4] outline-none focus:border-[#00c8d4]"
              style={{
                minWidth: "60px",
                width: `${Math.max(60, (label.length || 1) * 8 + 32)}px`,
              }}
            />
          ) : label ? (
            /* Saved label pill */
            <span
              className="cursor-pointer select-none rounded-full border border-[#2a2a30] bg-[#18181c] px-2 py-0.5 text-xs text-[#c0c0cc] transition-colors hover:border-[#3a3a42] hover:text-[#f0f0f4]"
            >
              {label}
            </span>
          ) : (
            /* Faint hint on active edge */
            isActive && (
              <span
                className="cursor-pointer select-none text-xs text-[#505060] transition-opacity"
              >
                double-click to add label
              </span>
            )
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
