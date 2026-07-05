"use client";

import { useCallback, useRef, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeToolbar,
  getSmoothStepPath,
  useInternalNode,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import { type CanvasEdge, type CanvasNode } from "@/types/canvas";

import { useCanvasDelete } from "./canvas-delete-context";
import { getEdgeParams } from "./floating-edge-utils";

export function CanvasEdgeRenderer({
  id,
  source,
  target,
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
  const deleteElements = useCanvasDelete();
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Floating edge: recompute the endpoints from the two nodes' current bounds so
  // the edge always attaches to the border facing the other node, regardless of
  // which fixed handle the connection was originally dropped on. Falls back to
  // the handle coordinates React Flow provides if a node isn't measured yet.
  const sourceNode = useInternalNode<CanvasNode>(source);
  const targetNode = useInternalNode<CanvasNode>(target);

  const floating =
    sourceNode && targetNode
      ? getEdgeParams(sourceNode, targetNode)
      : null;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX: floating?.sx ?? sourceX,
    sourceY: floating?.sy ?? sourceY,
    sourcePosition: floating?.sourcePos ?? sourcePosition,
    targetX: floating?.tx ?? targetX,
    targetY: floating?.ty ?? targetY,
    targetPosition: floating?.targetPos ?? targetPosition,
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

      {/* Delete action — React Flow's official EdgeToolbar. It portals to the
          edge layer and shows automatically while the edge is selected. Placed
          just above the edge center so it never overlaps the label pill. */}
      {!editing && (
        <EdgeToolbar
          edgeId={id}
          x={labelX}
          y={labelY}
          alignY="bottom"
          className="nodrag nopan"
        >
          <button
            type="button"
            title="Delete"
            aria-label="Delete edge"
            onClick={(e) => {
              e.stopPropagation();
              deleteElements?.([], [id]);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[#2a2a30] bg-[#18181c] text-[#c0c0cc] shadow-lg transition-colors hover:border-[#FF6166] hover:bg-[#3c1618] hover:text-[#FF6166] focus:outline-none"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </EdgeToolbar>
      )}
    </>
  );
}
