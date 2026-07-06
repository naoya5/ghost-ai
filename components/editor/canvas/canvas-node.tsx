"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  useConnection,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";

import {
  NODE_COLORS,
  getNodeColorPair,
  type CanvasNode,
  type NodeColor,
} from "@/types/canvas";

import { useCanvasDelete } from "./canvas-delete-context";

const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];
const LEGACY_BODY_TARGET_HANDLE_ID = "body-target";

// Minimum node dimensions
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

// ---- Floating color toolbar ----

interface ColorToolbarProps {
  activeColor: string;
  onColorSelect: (color: NodeColor) => void;
  onDelete: () => void;
}

function ColorToolbar({ activeColor, onColorSelect, onDelete }: ColorToolbarProps) {
  const stopEvent = useCallback((e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      // nodrag + nopan prevent React Flow from intercepting pointer events
      className="nodrag nopan absolute left-1/2 z-20 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-xl border border-[#2a2a30] bg-[#18181c] px-2 py-1.5 shadow-lg"
      style={{ bottom: "calc(100% + 8px)", top: "auto" }}
      onMouseDown={stopEvent}
      onPointerDown={stopEvent}
      onClick={stopEvent}
    >
      {NODE_COLORS.map((colorPair) => {
        const isActive = colorPair.fill === activeColor;
        return (
          <button
            key={colorPair.fill}
            type="button"
            title={colorPair.fill}
            onClick={(e) => {
              e.stopPropagation();
              onColorSelect(colorPair);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="group relative h-5 w-5 flex-shrink-0 rounded-full transition-transform hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: colorPair.fill,
              border: isActive
                ? `2px solid ${colorPair.text}`
                : "2px solid transparent",
              boxShadow: isActive
                ? `0 0 0 1px ${colorPair.text}44`
                : undefined,
            }}
          >
            {/* Hover glow */}
            <span
              className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                boxShadow: `0 0 6px 2px ${colorPair.text}55`,
              }}
            />
          </button>
        );
      })}

      {/* Divider between the color swatches and the delete action */}
      <span className="mx-0.5 h-5 w-px flex-shrink-0 bg-[#2a2a30]" />

      {/* Delete this node */}
      <button
        type="button"
        title="Delete"
        aria-label="Delete node"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-[#c0c0cc] transition-colors hover:bg-[#3c1618] hover:text-[#FF6166] focus:outline-none"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

// ---- Label editor overlay ----

interface LabelEditorProps {
  label: string;
  textColor: string;
  onCommit: (value: string) => void;
  onClose: () => void;
}

function LabelEditor({ label, textColor, onCommit, onClose }: LabelEditorProps) {
  const [value, setValue] = useState(label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Prevent canvas interactions
      e.stopPropagation();
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setValue(e.target.value);
      onCommit(e.target.value);
    },
    [onCommit],
  );

  const handleBlur = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <textarea
      ref={textareaRef}
      autoFocus
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      // nodrag prevents dragging the canvas while typing
      className="nodrag absolute inset-0 z-10 resize-none border-0 bg-transparent text-center text-sm outline-none"
      style={{
        color: textColor,
        padding: "8px",
        lineHeight: "1.4",
        // Match the shape background (transparent so the shape shows through)
        caretColor: textColor,
      }}
    />
  );
}

// ---- CSS-rendered shapes ----

function RectangleShape({
  fill,
  text,
  borderColor,
  label,
  editing,
  onDoubleClick,
}: {
  fill: string;
  text: string;
  borderColor: string;
  label: string;
  editing: boolean;
  onDoubleClick: () => void;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center rounded-xl border px-3 py-2 text-center text-sm"
      style={{ backgroundColor: fill, color: text, borderColor }}
      onDoubleClick={onDoubleClick}
    >
      {!editing && (
        <span className="line-clamp-3 break-words">
          {label || <span style={{ opacity: 0.4 }}>Label</span>}
        </span>
      )}
    </div>
  );
}

function PillShape({
  fill,
  text,
  borderColor,
  label,
  editing,
  onDoubleClick,
}: {
  fill: string;
  text: string;
  borderColor: string;
  label: string;
  editing: boolean;
  onDoubleClick: () => void;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center rounded-full border px-4 py-2 text-center text-sm"
      style={{ backgroundColor: fill, color: text, borderColor }}
      onDoubleClick={onDoubleClick}
    >
      {!editing && (
        <span className="line-clamp-2 break-words">
          {label || <span style={{ opacity: 0.4 }}>Label</span>}
        </span>
      )}
    </div>
  );
}

function CircleShape({
  fill,
  text,
  borderColor,
  label,
  editing,
  onDoubleClick,
}: {
  fill: string;
  text: string;
  borderColor: string;
  label: string;
  editing: boolean;
  onDoubleClick: () => void;
}) {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center rounded-full border text-center text-sm"
      style={{ backgroundColor: fill, color: text, borderColor }}
      onDoubleClick={onDoubleClick}
    >
      {!editing && (
        <span className="line-clamp-3 break-words px-2">
          {label || <span style={{ opacity: 0.4 }}>Label</span>}
        </span>
      )}
    </div>
  );
}

// ---- SVG-rendered shapes ----

function DiamondShape({
  fill,
  text,
  borderColor,
  label,
  width,
  height,
  editing,
  onDoubleClick,
}: {
  fill: string;
  text: string;
  borderColor: string;
  label: string;
  width: number;
  height: number;
  editing: boolean;
  onDoubleClick: () => void;
}) {
  const cx = width / 2;
  const cy = height / 2;
  const points = `${cx},2 ${width - 2},${cy} ${cx},${height - 2} 2,${cy}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 overflow-visible"
      onDoubleClick={onDoubleClick}
    >
      <polygon
        points={points}
        fill={fill}
        stroke={borderColor}
        strokeWidth="1.5"
      />
      {!editing && (
        <foreignObject x={cx / 2} y={cy / 2} width={cx} height={cy}>
          <div
            className="flex h-full w-full items-center justify-center text-center text-xs"
            style={{ color: text }}
          >
            <span className="line-clamp-2 break-words leading-tight">
              {label || <span style={{ opacity: 0.4 }}>Label</span>}
            </span>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}

function HexagonShape({
  fill,
  text,
  borderColor,
  label,
  width,
  height,
  editing,
  onDoubleClick,
}: {
  fill: string;
  text: string;
  borderColor: string;
  label: string;
  width: number;
  height: number;
  editing: boolean;
  onDoubleClick: () => void;
}) {
  // Flat-top hexagon points
  const cx = width / 2;
  const cy = height / 2;
  const rx = cx - 2;
  const ry = cy - 2;
  const points = [
    [cx - rx, cy],
    [cx - rx / 2, cy - ry],
    [cx + rx / 2, cy - ry],
    [cx + rx, cy],
    [cx + rx / 2, cy + ry],
    [cx - rx / 2, cy + ry],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(" ");

  const innerW = rx;
  const innerH = ry;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 overflow-visible"
      onDoubleClick={onDoubleClick}
    >
      <polygon
        points={points}
        fill={fill}
        stroke={borderColor}
        strokeWidth="1.5"
      />
      {!editing && (
        <foreignObject
          x={cx - innerW / 2}
          y={cy - innerH / 2}
          width={innerW}
          height={innerH}
        >
          <div
            className="flex h-full w-full items-center justify-center text-center text-xs"
            style={{ color: text }}
          >
            <span className="line-clamp-2 break-words leading-tight">
              {label || <span style={{ opacity: 0.4 }}>Label</span>}
            </span>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}

function CylinderShape({
  fill,
  text,
  borderColor,
  label,
  width,
  height,
  editing,
  onDoubleClick,
}: {
  fill: string;
  text: string;
  borderColor: string;
  label: string;
  width: number;
  height: number;
  editing: boolean;
  onDoubleClick: () => void;
}) {
  const rx = width / 2 - 2;
  const ry = Math.max(8, height * 0.12); // ellipse vertical radius
  const cx = width / 2;
  const topY = ry + 2;
  const bottomY = height - ry - 2;
  const bodyHeight = bottomY - topY;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 overflow-visible"
      onDoubleClick={onDoubleClick}
    >
      {/* Body rectangle */}
      <rect
        x={cx - rx}
        y={topY}
        width={rx * 2}
        height={bodyHeight}
        fill={fill}
        stroke="none"
      />
      {/* Left and right borders of body */}
      <line
        x1={cx - rx}
        y1={topY}
        x2={cx - rx}
        y2={bottomY}
        stroke={borderColor}
        strokeWidth="1.5"
      />
      <line
        x1={cx + rx}
        y1={topY}
        x2={cx + rx}
        y2={bottomY}
        stroke={borderColor}
        strokeWidth="1.5"
      />
      {/* Bottom ellipse (fill first to cover body bottom edge) */}
      <ellipse
        cx={cx}
        cy={bottomY}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={borderColor}
        strokeWidth="1.5"
      />
      {/* Top ellipse */}
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ry}
        fill={fill}
        stroke={borderColor}
        strokeWidth="1.5"
      />
      {/* Label */}
      {!editing && (
        <foreignObject
          x={cx - rx * 0.7}
          y={topY + ry}
          width={rx * 1.4}
          height={bodyHeight - ry}
        >
          <div
            className="flex h-full w-full items-center justify-center text-center text-xs"
            style={{ color: text }}
          >
            <span className="line-clamp-2 break-words leading-tight">
              {label || <span style={{ opacity: 0.4 }}>Label</span>}
            </span>
          </div>
        </foreignObject>
      )}
    </svg>
  );
}

// ---- Main renderer ----

const handleStyle: CSSProperties = {
  width: 8,
  height: 8,
  border: "1.5px solid var(--border-default)",
  backgroundColor: "#ffffff",
  borderRadius: "50%",
  transition: "opacity 0.15s ease",
  // Keep every handle above the shape body. The shapes render after the handles
  // in the DOM, so without this their fill sits on top of the right/bottom/left
  // handles and swallows the pointerdown that starts a connection — leaving only
  // the top handle (whose dot pokes out above the node) reliably connectable.
  zIndex: 3,
};

function getTargetHandleStyle(acceptingConnection: boolean): CSSProperties {
  return {
    ...handleStyle,
    pointerEvents: acceptingConnection ? "auto" : "none",
    zIndex: acceptingConnection ? 5 : 2,
  };
}

// Full-node "drop anywhere" target handle. The four edge handles only accept a
// drop within `connectionRadius` (a small px window) of their center, so most of
// a node's surface used to be a dead zone where releasing a connection created
// no edge — the drag line stretched but nothing connected. This invisible handle
// covers the entire node so a connection can be dropped anywhere on it. It stays
// `pointerEvents: none` at rest (so double-click-to-edit, node drag and starting
// a connection from the source handles all work), and only becomes an active drop
// target while another node's connection is in progress. It keeps the historic
// `body-target` id so edges saved against it still resolve.
function getBodyTargetHandleStyle(acceptingConnection: boolean): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transform: "none",
    borderRadius: 0,
    border: "none",
    background: "transparent",
    opacity: 0,
    // Sit above the shape body (so it catches the drop) but below the four edge
    // target handles (z 5), so an exact drop on an edge handle still wins.
    zIndex: acceptingConnection ? 4 : 0,
    pointerEvents: acceptingConnection ? "auto" : "none",
  };
}

export function CanvasNodeRenderer({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow();
  const deleteElements = useCanvasDelete();
  // True while a connection is being dragged anywhere on the canvas — reveal
  // every node's handles so they are visible drop targets, not just the hovered
  // node's. Without this, target handles stay at opacity 0 during the drag
  // (the pointer is captured, so hover never fires) and users can't aim.
  const connecting = useConnection((c) => c.inProgress);
  const connectionSourceNodeId = useConnection((c) => c.fromNode?.id ?? null);
  const acceptingConnection =
    connecting &&
    connectionSourceNodeId !== null &&
    connectionSourceNodeId !== id;
  const [editing, setEditing] = useState(false);
  const [nodeHovered, setNodeHovered] = useState(false);

  const { fill, text } = getNodeColorPair(data.color);
  const borderColor = selected ? text : "var(--border-subtle)";

  const nodeWidth = width ?? 160;
  const nodeHeight = height ?? 80;

  const openEditor = useCallback(() => {
    setEditing(true);
  }, []);

  const closeEditor = useCallback(() => {
    setEditing(false);
  }, []);

  const commitLabel = useCallback(
    (value: string) => {
      updateNodeData(id, { label: value });
    },
    [id, updateNodeData],
  );

  const handleColorSelect = useCallback(
    (colorPair: NodeColor) => {
      updateNodeData(id, { color: colorPair.fill });
    },
    [id, updateNodeData],
  );

  const handleDelete = useCallback(() => {
    deleteElements?.([id], []);
  }, [deleteElements, id]);

  const svgShapes = ["diamond", "hexagon", "cylinder"] as const;
  type SvgShape = (typeof svgShapes)[number];
  const isSvgShape = (s: string): s is SvgShape =>
    (svgShapes as readonly string[]).includes(s);

  if (isSvgShape(data.shape)) {
    return (
      <div
        className="relative"
        style={{ width: nodeWidth, height: nodeHeight }}
        onMouseEnter={() => setNodeHovered(true)}
        onMouseLeave={() => setNodeHovered(false)}
      >
        {selected && (
          <ColorToolbar
            activeColor={data.color}
            onColorSelect={handleColorSelect}
            onDelete={handleDelete}
          />
        )}
        <NodeResizer
          isVisible={selected}
          minWidth={MIN_WIDTH}
          minHeight={MIN_HEIGHT}
          handleStyle={{
            width: 8,
            height: 8,
            borderRadius: 2,
            backgroundColor: "var(--accent-primary)",
            borderColor: "var(--bg-base)",
            borderWidth: 1,
          }}
          lineStyle={{
            borderColor: "var(--accent-primary)",
            borderWidth: 1,
            opacity: 0.6,
          }}
        />
        {HANDLE_POSITIONS.map((position) => (
          <div key={position}>
            <Handle
              id={position}
              type="source"
              position={position}
              style={{
                ...handleStyle,
                opacity: nodeHovered || selected || connecting ? 1 : 0,
              }}
            />
            <Handle
              id={position}
              type="target"
              position={position}
              className="nodrag nopan"
              style={{
                ...getTargetHandleStyle(acceptingConnection),
                opacity: nodeHovered || selected || connecting ? 1 : 0,
              }}
            />
          </div>
        ))}
        <Handle
          id={LEGACY_BODY_TARGET_HANDLE_ID}
          type="target"
          position={Position.Top}
          className="nodrag nopan"
          style={getBodyTargetHandleStyle(acceptingConnection)}
        />
        {data.shape === "diamond" && (
          <DiamondShape
            fill={fill}
            text={text}
            borderColor={borderColor}
            label={data.label}
            width={nodeWidth}
            height={nodeHeight}
            editing={editing}
            onDoubleClick={openEditor}
          />
        )}
        {data.shape === "hexagon" && (
          <HexagonShape
            fill={fill}
            text={text}
            borderColor={borderColor}
            label={data.label}
            width={nodeWidth}
            height={nodeHeight}
            editing={editing}
            onDoubleClick={openEditor}
          />
        )}
        {data.shape === "cylinder" && (
          <CylinderShape
            fill={fill}
            text={text}
            borderColor={borderColor}
            label={data.label}
            width={nodeWidth}
            height={nodeHeight}
            editing={editing}
            onDoubleClick={openEditor}
          />
        )}
        {editing && (
          <LabelEditor
            label={data.label}
            textColor={text}
            onCommit={commitLabel}
            onClose={closeEditor}
          />
        )}
      </div>
    );
  }

  // CSS shapes
  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setNodeHovered(true)}
      onMouseLeave={() => setNodeHovered(false)}
    >
      {selected && (
        <ColorToolbar
          activeColor={data.color}
          onColorSelect={handleColorSelect}
          onDelete={handleDelete}
        />
      )}
      <NodeResizer
        isVisible={selected}
        minWidth={MIN_WIDTH}
        minHeight={MIN_HEIGHT}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          backgroundColor: "var(--accent-primary)",
          borderColor: "var(--bg-base)",
          borderWidth: 1,
        }}
        lineStyle={{
          borderColor: "var(--accent-primary)",
          borderWidth: 1,
          opacity: 0.6,
        }}
      />
      {HANDLE_POSITIONS.map((position) => (
        <div key={position}>
          <Handle
            id={position}
            type="source"
            position={position}
            style={{
              ...handleStyle,
              opacity: nodeHovered || selected || connecting ? 1 : 0,
            }}
          />
          <Handle
            id={position}
            type="target"
            position={position}
            className="nodrag nopan"
            style={{
              ...getTargetHandleStyle(acceptingConnection),
              opacity: nodeHovered || selected || connecting ? 1 : 0,
            }}
          />
        </div>
      ))}
      <Handle
        id={LEGACY_BODY_TARGET_HANDLE_ID}
        type="target"
        position={Position.Top}
        className="nodrag nopan"
        style={getBodyTargetHandleStyle(acceptingConnection)}
      />
      {data.shape === "rectangle" && (
        <RectangleShape
          fill={fill}
          text={text}
          borderColor={borderColor}
          label={data.label}
          editing={editing}
          onDoubleClick={openEditor}
        />
      )}
      {data.shape === "pill" && (
        <PillShape
          fill={fill}
          text={text}
          borderColor={borderColor}
          label={data.label}
          editing={editing}
          onDoubleClick={openEditor}
        />
      )}
      {data.shape === "circle" && (
        <CircleShape
          fill={fill}
          text={text}
          borderColor={borderColor}
          label={data.label}
          editing={editing}
          onDoubleClick={openEditor}
        />
      )}
      {editing && (
        <LabelEditor
          label={data.label}
          textColor={text}
          onCommit={commitLabel}
          onClose={closeEditor}
        />
      )}
    </div>
  );
}
