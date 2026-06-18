"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getNodeColorPair, type CanvasNode } from "@/types/canvas";

import { CANVAS_TEMPLATES, type CanvasTemplate } from "./starter-templates";

interface StarterTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (template: CanvasTemplate) => void;
}

const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 150;
const PREVIEW_PADDING = 12;

interface NodeBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  text: string;
  shape: CanvasNode["data"]["shape"];
}

function nodeSize(node: CanvasNode): { width: number; height: number } {
  const style = node.style as
    | { width?: number; height?: number }
    | undefined;
  return {
    width: typeof style?.width === "number" ? style.width : 160,
    height: typeof style?.height === "number" ? style.height : 80,
  };
}

/**
 * Computes a fit-to-viewport transform from the template's node positions and
 * returns positioned/scaled boxes plus a coordinate mapper for edge centers.
 */
function buildPreview(template: CanvasTemplate) {
  if (template.nodes.length === 0) {
    return {
      boxes: [] as NodeBox[],
      center: () => ({ x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT / 2 }),
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of template.nodes) {
    const { width, height } = nodeSize(node);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }

  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const availWidth = PREVIEW_WIDTH - PREVIEW_PADDING * 2;
  const availHeight = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;
  const scale = Math.min(availWidth / contentWidth, availHeight / contentHeight);

  // Center the scaled content inside the viewport.
  const offsetX = (PREVIEW_WIDTH - contentWidth * scale) / 2;
  const offsetY = (PREVIEW_HEIGHT - contentHeight * scale) / 2;

  const project = (x: number, y: number) => ({
    x: (x - minX) * scale + offsetX,
    y: (y - minY) * scale + offsetY,
  });

  const boxes: NodeBox[] = template.nodes.map((node) => {
    const { width, height } = nodeSize(node);
    const { x, y } = project(node.position.x, node.position.y);
    const pair = getNodeColorPair(node.data.color);
    return {
      id: node.id,
      x,
      y,
      width: width * scale,
      height: height * scale,
      fill: pair.fill,
      text: pair.text,
      shape: node.data.shape,
    };
  });

  const center = (nodeId: string) => {
    const node = template.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT / 2 };
    const { width, height } = nodeSize(node);
    return project(node.position.x + width / 2, node.position.y + height / 2);
  };

  return { boxes, center };
}

function PreviewShape({ box }: { box: NodeBox }) {
  const { x, y, width, height, fill, text, shape } = box;
  const stroke = text;
  const strokeWidth = 1;

  switch (shape) {
    case "diamond": {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const points = `${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}`;
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    case "hexagon": {
      const inset = width * 0.22;
      const cy = y + height / 2;
      const points = [
        `${x + inset},${y}`,
        `${x + width - inset},${y}`,
        `${x + width},${cy}`,
        `${x + width - inset},${y + height}`,
        `${x + inset},${y + height}`,
        `${x},${cy}`,
      ].join(" ");
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    case "circle": {
      const r = Math.min(width, height) / 2;
      return (
        <circle
          cx={x + width / 2}
          cy={y + height / 2}
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    case "pill": {
      const r = height / 2;
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={r}
          ry={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
    }
    case "cylinder": {
      const ellipseH = Math.min(height * 0.22, 8);
      return (
        <g fill={fill} stroke={stroke} strokeWidth={strokeWidth}>
          <rect x={x} y={y + ellipseH / 2} width={width} height={height - ellipseH} />
          <ellipse cx={x + width / 2} cy={y + ellipseH / 2} rx={width / 2} ry={ellipseH / 2} />
          <ellipse
            cx={x + width / 2}
            cy={y + height - ellipseH / 2}
            rx={width / 2}
            ry={ellipseH / 2}
          />
        </g>
      );
    }
    default:
      return (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          rx={3}
          ry={3}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      );
  }
}

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { boxes, center } = buildPreview(template);

  return (
    <svg
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      className="h-full w-full"
      role="img"
      aria-label={`${template.name} diagram preview`}
    >
      <g>
        {template.edges.map((edge) => {
          const from = center(edge.source);
          const to = center(edge.target);
          return (
            <line
              key={edge.id}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#808090"
              strokeWidth={1}
            />
          );
        })}
      </g>
      <g>
        {boxes.map((box) => (
          <PreviewShape key={box.id} box={box} />
        ))}
      </g>
    </svg>
  );
}

export function StarterTemplatesModal({
  isOpen,
  onClose,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-3xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
          <DialogDescription>
            Pick a prebuilt diagram to start from. Importing replaces everything
            currently on the canvas.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          {CANVAS_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-3 rounded-2xl border border-surface-border bg-surface p-3"
            >
              <div className="overflow-hidden rounded-xl border border-surface-border bg-base">
                <div className="aspect-[280/150] w-full">
                  <TemplatePreview template={template} />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <h3 className="text-sm font-medium text-copy-primary">
                  {template.name}
                </h3>
                <p className="text-xs leading-relaxed text-copy-muted">
                  {template.description}
                </p>
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  onImport(template);
                  onClose();
                }}
              >
                Import template
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
