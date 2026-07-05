"use client";

import { createContext, useContext } from "react";

/**
 * Shared deletion handler for the canvas. Removing a node or edge must flow
 * through the Liveblocks change handlers (see FlowCanvas) so it syncs to every
 * client — React Flow's built-in delete path is disabled for that reason. This
 * context hands that single routed handler down to the node/edge renderers so
 * their inline delete buttons remove elements the same way Backspace does.
 *
 * `deleteElements(nodeIds, edgeIds)` removes the given nodes and edges, and
 * cascades removal to any edge left dangling by a removed node.
 */
export type DeleteElements = (nodeIds: string[], edgeIds: string[]) => void;

const CanvasDeleteContext = createContext<DeleteElements | null>(null);

export const CanvasDeleteProvider = CanvasDeleteContext.Provider;

export function useCanvasDelete(): DeleteElements | null {
  return useContext(CanvasDeleteContext);
}
