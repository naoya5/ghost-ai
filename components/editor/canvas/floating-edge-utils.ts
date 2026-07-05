import { Position, type InternalNode } from "@xyflow/react";

import type { CanvasNode, NodeShape } from "@/types/canvas";

// ---- Floating edge geometry ----
//
// Instead of pinning an edge to one fixed handle (top/right/bottom/left), a
// floating edge attaches to the point on each node's border that faces the
// other node. This keeps connections clean from any angle — no orthogonal
// loops when the connected handle happens to point away from the target.
//
// Adapted from React Flow's official "Floating Edges" example.

type CanvasInternalNode = InternalNode<CanvasNode>;

interface Point {
  x: number;
  y: number;
}

interface NodeGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

const MIN_DIMENSION = 1;
const SVG_SHAPE_INSET = 2;
const EPSILON = 0.0001;

function getNodeSize(node: CanvasInternalNode): {
  width: number;
  height: number;
} {
  const style = node.internals.userNode.style;
  const styleWidth = typeof style?.width === "number" ? style.width : undefined;
  const styleHeight =
    typeof style?.height === "number" ? style.height : undefined;

  return {
    width:
      node.measured.width ??
      node.width ??
      node.initialWidth ??
      styleWidth ??
      MIN_DIMENSION,
    height:
      node.measured.height ??
      node.height ??
      node.initialHeight ??
      styleHeight ??
      MIN_DIMENSION,
  };
}

function getNodeGeometry(node: CanvasInternalNode): NodeGeometry {
  const { width, height } = getNodeSize(node);
  const { x, y } = node.internals.positionAbsolute;

  return {
    x,
    y,
    width,
    height,
    cx: x + width / 2,
    cy: y + height / 2,
    rx: Math.max(width / 2, MIN_DIMENSION),
    ry: Math.max(height / 2, MIN_DIMENSION),
  };
}

function getNodeShape(node: CanvasInternalNode): NodeShape {
  return node.internals.userNode.data.shape;
}

function getTargetCenter(targetNode: CanvasInternalNode): Point {
  const target = getNodeGeometry(targetNode);
  return { x: target.cx, y: target.cy };
}

function getRectangleIntersection(
  geometry: NodeGeometry,
  targetPoint: Point,
  inset = 0,
): Point {
  const left = geometry.x + inset;
  const right = geometry.x + geometry.width - inset;
  const top = geometry.y + inset;
  const bottom = geometry.y + geometry.height - inset;
  const rx = Math.max((right - left) / 2, MIN_DIMENSION);
  const ry = Math.max((bottom - top) / 2, MIN_DIMENSION);
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const dx = targetPoint.x - cx;
  const dy = targetPoint.y - cy;

  if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
    return { x: cx + rx, y: cy };
  }

  const scaleX = Math.abs(dx) < EPSILON ? Infinity : rx / Math.abs(dx);
  const scaleY = Math.abs(dy) < EPSILON ? Infinity : ry / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
}

function getEllipseIntersection(
  geometry: NodeGeometry,
  targetPoint: Point,
  inset = 0,
): Point {
  const rx = Math.max(geometry.rx - inset, MIN_DIMENSION);
  const ry = Math.max(geometry.ry - inset, MIN_DIMENSION);
  const dx = targetPoint.x - geometry.cx;
  const dy = targetPoint.y - geometry.cy;

  if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
    return { x: geometry.cx + rx, y: geometry.cy };
  }

  const scale = 1 / Math.sqrt((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry));

  return {
    x: geometry.cx + dx * scale,
    y: geometry.cy + dy * scale,
  };
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function getPolygonIntersection(
  geometry: NodeGeometry,
  targetPoint: Point,
  points: Point[],
): Point {
  const ray = {
    x: targetPoint.x - geometry.cx,
    y: targetPoint.y - geometry.cy,
  };

  if (Math.abs(ray.x) < EPSILON && Math.abs(ray.y) < EPSILON) {
    return points[0] ?? { x: geometry.cx, y: geometry.cy };
  }

  let nearestDistance = Infinity;
  let nearestPoint: Point | null = null;

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    const segment = { x: end.x - start.x, y: end.y - start.y };
    const denominator = cross(ray, segment);

    if (Math.abs(denominator) < EPSILON) continue;

    const offset = { x: start.x - geometry.cx, y: start.y - geometry.cy };
    const rayDistance = cross(offset, segment) / denominator;
    const segmentDistance = cross(offset, ray) / denominator;

    if (
      rayDistance >= -EPSILON &&
      segmentDistance >= -EPSILON &&
      segmentDistance <= 1 + EPSILON &&
      rayDistance < nearestDistance
    ) {
      nearestDistance = rayDistance;
      nearestPoint = {
        x: geometry.cx + ray.x * rayDistance,
        y: geometry.cy + ray.y * rayDistance,
      };
    }
  }

  return nearestPoint ?? getRectangleIntersection(geometry, targetPoint);
}

function getDiamondIntersection(
  geometry: NodeGeometry,
  targetPoint: Point,
): Point {
  const inset = SVG_SHAPE_INSET;
  const points = [
    { x: geometry.cx, y: geometry.y + inset },
    { x: geometry.x + geometry.width - inset, y: geometry.cy },
    { x: geometry.cx, y: geometry.y + geometry.height - inset },
    { x: geometry.x + inset, y: geometry.cy },
  ];

  return getPolygonIntersection(geometry, targetPoint, points);
}

function getHexagonIntersection(
  geometry: NodeGeometry,
  targetPoint: Point,
): Point {
  const rx = Math.max(geometry.rx - SVG_SHAPE_INSET, MIN_DIMENSION);
  const ry = Math.max(geometry.ry - SVG_SHAPE_INSET, MIN_DIMENSION);
  const points = [
    { x: geometry.cx - rx, y: geometry.cy },
    { x: geometry.cx - rx / 2, y: geometry.cy - ry },
    { x: geometry.cx + rx / 2, y: geometry.cy - ry },
    { x: geometry.cx + rx, y: geometry.cy },
    { x: geometry.cx + rx / 2, y: geometry.cy + ry },
    { x: geometry.cx - rx / 2, y: geometry.cy + ry },
  ];

  return getPolygonIntersection(geometry, targetPoint, points);
}

function getPillIntersection(
  geometry: NodeGeometry,
  targetPoint: Point,
): Point {
  if (geometry.width <= geometry.height) {
    return getEllipseIntersection(geometry, targetPoint);
  }

  const radius = Math.max(geometry.height / 2, MIN_DIMENSION);
  const capOffset = Math.max(geometry.width / 2 - radius, 0);
  const dx = targetPoint.x - geometry.cx;
  const dy = targetPoint.y - geometry.cy;

  if (Math.abs(dx) < EPSILON && Math.abs(dy) < EPSILON) {
    return { x: geometry.cx + geometry.rx, y: geometry.cy };
  }

  const candidates: Array<{ distance: number; point: Point }> = [];

  if (Math.abs(dy) >= EPSILON) {
    for (const y of [geometry.cy - radius, geometry.cy + radius]) {
      const distance = (y - geometry.cy) / dy;
      const x = geometry.cx + dx * distance;
      if (
        distance >= -EPSILON &&
        x >= geometry.cx - capOffset - EPSILON &&
        x <= geometry.cx + capOffset + EPSILON
      ) {
        candidates.push({ distance, point: { x, y } });
      }
    }
  }

  for (const capCenterX of [geometry.cx - capOffset, geometry.cx + capOffset]) {
    const localX = geometry.cx - capCenterX;
    const a = dx * dx + dy * dy;
    const b = 2 * (localX * dx);
    const c = localX * localX - radius * radius;
    const discriminant = b * b - 4 * a * c;

    if (a < EPSILON || discriminant < 0) continue;

    const sqrt = Math.sqrt(discriminant);
    for (const distance of [(-b - sqrt) / (2 * a), (-b + sqrt) / (2 * a)]) {
      const x = geometry.cx + dx * distance;
      const y = geometry.cy + dy * distance;
      const onCap =
        capCenterX < geometry.cx
          ? x <= capCenterX + EPSILON
          : x >= capCenterX - EPSILON;

      if (distance >= -EPSILON && onCap) {
        candidates.push({ distance, point: { x, y } });
      }
    }
  }

  return (
    candidates
      .filter((candidate) => candidate.distance >= -EPSILON)
      .sort((a, b) => a.distance - b.distance)[0]?.point ??
    getRectangleIntersection(geometry, targetPoint)
  );
}

function getShapeIntersection(
  node: CanvasInternalNode,
  targetNode: CanvasInternalNode,
): Point {
  const geometry = getNodeGeometry(node);
  const targetPoint = getTargetCenter(targetNode);
  const shape = getNodeShape(node);

  switch (shape) {
    case "circle":
      return getEllipseIntersection(geometry, targetPoint);
    case "pill":
      return getPillIntersection(geometry, targetPoint);
    case "diamond":
      return getDiamondIntersection(geometry, targetPoint);
    case "hexagon":
      return getHexagonIntersection(geometry, targetPoint);
    case "cylinder":
      return getRectangleIntersection(geometry, targetPoint, SVG_SHAPE_INSET);
    case "rectangle":
    default:
      return getRectangleIntersection(geometry, targetPoint);
  }
}

// Returns the point where a line from `intersectionNode`'s center to
// `targetNode`'s center crosses `intersectionNode`'s visible border.
function getNodeIntersection(
  intersectionNode: CanvasInternalNode,
  targetNode: CanvasInternalNode,
): Point {
  return getShapeIntersection(intersectionNode, targetNode);
}

// Maps an intersection point back to the border side it sits on, so the path
// generator knows which direction the edge should leave/enter the node.
function getEdgePosition(
  node: CanvasInternalNode,
  intersectionPoint: Point,
): Position {
  const geometry = getNodeGeometry(node);
  const dx = (intersectionPoint.x - geometry.cx) / geometry.rx;
  const dy = (intersectionPoint.y - geometry.cy) / geometry.ry;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? Position.Right : Position.Left;
  }

  return dy >= 0 ? Position.Bottom : Position.Top;
}

export interface EdgeParams {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePos: Position;
  targetPos: Position;
}

// Computes the border-to-border connection geometry between two nodes.
export function getEdgeParams(
  source: CanvasInternalNode,
  target: CanvasInternalNode,
): EdgeParams {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);

  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}
