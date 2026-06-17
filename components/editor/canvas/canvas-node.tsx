"use client";

import { useCallback, useRef, useState, type CSSProperties } from "react";
import { Handle, NodeResizer, Position, useReactFlow, type NodeProps } from "@xyflow/react";

import { NODE_COLORS, getNodeColorPair, type CanvasNode, type NodeColor } from "@/types/canvas";

const HANDLE_POSITIONS = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
];

// Minimum node dimensions
const MIN_WIDTH = 80;
const MIN_HEIGHT = 40;

// ---- Floating color toolbar ----

interface ColorToolbarProps {
  activeColor: string;
  onColorSelect: (color: NodeColor) => void;
}

function ColorToolbar({ activeColor, onColorSelect }: ColorToolbarProps) {
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
};

export function CanvasNodeRenderer({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<CanvasNode>) {
  const { updateNodeData } = useReactFlow();
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
          <Handle
            key={position}
            id={position}
            type="source"
            position={position}
            style={{
              ...handleStyle,
              opacity: nodeHovered || selected ? 1 : 0,
            }}
          />
        ))}
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
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          style={{
            ...handleStyle,
            opacity: nodeHovered || selected ? 1 : 0,
          }}
        />
      ))}
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
