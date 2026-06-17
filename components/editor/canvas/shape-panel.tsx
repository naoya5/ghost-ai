"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import {
  CircleIcon,
  CylinderIcon,
  DiamondIcon,
  HexagonIcon,
  PillIcon,
  RectangleHorizontalIcon,
  type LucideIcon,
} from "lucide-react";

import {
  CANVAS_SHAPE_DRAG_TYPE,
  SHAPE_DEFAULT_SIZES,
  type NodeShape,
} from "@/types/canvas";

const SHAPE_BUTTONS: { shape: NodeShape; label: string; Icon: LucideIcon }[] = [
  { shape: "rectangle", label: "Rectangle", Icon: RectangleHorizontalIcon },
  { shape: "diamond", label: "Diamond", Icon: DiamondIcon },
  { shape: "circle", label: "Circle", Icon: CircleIcon },
  { shape: "pill", label: "Pill", Icon: PillIcon },
  { shape: "cylinder", label: "Cylinder", Icon: CylinderIcon },
  { shape: "hexagon", label: "Hexagon", Icon: HexagonIcon },
];

// Default node fill for preview (neutral dark)
const PREVIEW_FILL = "#1F1F1F";
const PREVIEW_BORDER = "#3a3a42";
const PREVIEW_TEXT = "#EDEDED";

type GhostState = {
  shape: NodeShape;
  width: number;
  height: number;
  x: number;
  y: number;
  visible: boolean;
};

// ---- SVG ghost shapes ----

function DiamondGhost({ width, height }: { width: number; height: number }) {
  const cx = width / 2;
  const cy = height / 2;
  const points = `${cx},2 ${width - 2},${cy} ${cx},${height - 2} 2,${cy}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon
        points={points}
        fill={PREVIEW_FILL}
        stroke={PREVIEW_BORDER}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function HexagonGhost({ width, height }: { width: number; height: number }) {
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
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon
        points={points}
        fill={PREVIEW_FILL}
        stroke={PREVIEW_BORDER}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function CylinderGhost({ width, height }: { width: number; height: number }) {
  const rx = width / 2 - 2;
  const ry = Math.max(8, height * 0.12);
  const cx = width / 2;
  const topY = ry + 2;
  const bottomY = height - ry - 2;
  const bodyHeight = bottomY - topY;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={cx - rx}
        y={topY}
        width={rx * 2}
        height={bodyHeight}
        fill={PREVIEW_FILL}
        stroke="none"
      />
      <line
        x1={cx - rx}
        y1={topY}
        x2={cx - rx}
        y2={bottomY}
        stroke={PREVIEW_BORDER}
        strokeWidth="1.5"
      />
      <line
        x1={cx + rx}
        y1={topY}
        x2={cx + rx}
        y2={bottomY}
        stroke={PREVIEW_BORDER}
        strokeWidth="1.5"
      />
      <ellipse
        cx={cx}
        cy={bottomY}
        rx={rx}
        ry={ry}
        fill={PREVIEW_FILL}
        stroke={PREVIEW_BORDER}
        strokeWidth="1.5"
      />
      <ellipse
        cx={cx}
        cy={topY}
        rx={rx}
        ry={ry}
        fill={PREVIEW_FILL}
        stroke={PREVIEW_BORDER}
        strokeWidth="1.5"
      />
    </svg>
  );
}

function ShapeGhost({
  shape,
  width,
  height,
}: {
  shape: NodeShape;
  width: number;
  height: number;
}) {
  if (shape === "diamond") {
    return <DiamondGhost width={width} height={height} />;
  }
  if (shape === "hexagon") {
    return <HexagonGhost width={width} height={height} />;
  }
  if (shape === "cylinder") {
    return <CylinderGhost width={width} height={height} />;
  }

  // CSS shapes
  const baseStyle: React.CSSProperties = {
    width,
    height,
    backgroundColor: PREVIEW_FILL,
    border: `1.5px solid ${PREVIEW_BORDER}`,
    color: PREVIEW_TEXT,
  };

  if (shape === "rectangle") {
    return <div style={{ ...baseStyle, borderRadius: "0.75rem" }} />;
  }
  if (shape === "pill") {
    return <div style={{ ...baseStyle, borderRadius: 9999 }} />;
  }
  // circle
  return <div style={{ ...baseStyle, borderRadius: "50%" }} />;
}

export function ShapePanel() {
  const [ghost, setGhost] = useState<GhostState | null>(null);
  const ghostRef = useRef<GhostState | null>(null);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!ghostRef.current?.visible) return;
    setGhost((prev) =>
      prev ? { ...prev, x: e.clientX, y: e.clientY } : prev,
    );
  }, []);

  const hideGhost = useCallback(() => {
    setGhost(null);
    ghostRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("dragend", hideGhost);
    window.addEventListener("drop", hideGhost);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("dragend", hideGhost);
      window.removeEventListener("drop", hideGhost);
    };
  }, [onMouseMove, hideGhost]);

  function handleDragStart(event: DragEvent<HTMLButtonElement>, shape: NodeShape) {
    const size = SHAPE_DEFAULT_SIZES[shape];
    event.dataTransfer.setData(
      CANVAS_SHAPE_DRAG_TYPE,
      JSON.stringify({ shape, width: size.width, height: size.height }),
    );
    event.dataTransfer.effectAllowed = "move";

    // Hide the default drag image
    const blankImg = new Image();
    blankImg.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    event.dataTransfer.setDragImage(blankImg, 0, 0);

    const nextGhost: GhostState = {
      shape,
      width: size.width,
      height: size.height,
      x: event.clientX,
      y: event.clientY,
      visible: true,
    };
    ghostRef.current = nextGhost;
    setGhost(nextGhost);
  }

  return (
    <>
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-lg backdrop-blur">
        {SHAPE_BUTTONS.map(({ shape, label, Icon }) => (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) => handleDragStart(event, shape)}
            title={label}
            aria-label={`Drag to add ${label}`}
            className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-elevated hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="h-5 w-5" />
          </button>
        ))}
      </div>

      {ghost?.visible && (
        <div
          className="pointer-events-none fixed z-50 opacity-70"
          style={{
            left: ghost.x - ghost.width / 2,
            top: ghost.y - ghost.height / 2,
          }}
        >
          <ShapeGhost
            shape={ghost.shape}
            width={ghost.width}
            height={ghost.height}
          />
        </div>
      )}
    </>
  );
}
