"use client";

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

function handleDragStart(event: DragEvent<HTMLButtonElement>, shape: NodeShape) {
  const size = SHAPE_DEFAULT_SIZES[shape];
  event.dataTransfer.setData(
    CANVAS_SHAPE_DRAG_TYPE,
    JSON.stringify({ shape, width: size.width, height: size.height }),
  );
  event.dataTransfer.effectAllowed = "move";
}

export function ShapePanel() {
  return (
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
  );
}
