import type { Edge, Node } from "@xyflow/react";

export const CANVAS_NODE_TYPE = "canvasNode";
export const CANVAS_EDGE_TYPE = "canvasEdge";

export const CANVAS_SHAPE_DRAG_TYPE = "application/ghost-ai-shape";

export const NODE_SHAPES = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;

export type NodeShape = (typeof NODE_SHAPES)[number];

export type NodeColor = {
  fill: string;
  text: string;
};

export const NODE_COLORS: NodeColor[] = [
  { fill: "#1F1F1F", text: "#EDEDED" },
  { fill: "#10233D", text: "#52A8FF" },
  { fill: "#2E1938", text: "#BF7AF0" },
  { fill: "#331B00", text: "#FF990A" },
  { fill: "#3C1618", text: "#FF6166" },
  { fill: "#3A1726", text: "#F75F8F" },
  { fill: "#0F2E18", text: "#62C073" },
  { fill: "#062822", text: "#0AC7B4" },
];

export const DEFAULT_NODE_COLOR = NODE_COLORS[0].fill;

export function getNodeColorPair(fill: string): NodeColor {
  return NODE_COLORS.find((color) => color.fill === fill) ?? NODE_COLORS[0];
}

export const SHAPE_DEFAULT_SIZES: Record<
  NodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 140, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 64 },
  cylinder: { width: 120, height: 120 },
  hexagon: { width: 140, height: 110 },
};

export type ShapeDragPayload = {
  shape: NodeShape;
  width: number;
  height: number;
};

export type CanvasNodeData = {
  label: string;
  color: string;
  shape: NodeShape;
};

export type CanvasNode = Node<CanvasNodeData, typeof CANVAS_NODE_TYPE>;

export type CanvasEdge = Edge<Record<string, unknown>, typeof CANVAS_EDGE_TYPE>;
