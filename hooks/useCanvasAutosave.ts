"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface CanvasAutosave {
  status: SaveStatus;
  // Immediately persist the current canvas, bypassing the debounce. Used by the
  // manual Save button in the workspace navbar. The debounced autosave calls the
  // exact same function.
  save: () => void;
}

interface UseCanvasAutosaveOptions {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  // Autosave only runs once the editor has finished resolving the initial
  // canvas state (either the room already had content, or the saved blob was
  // loaded). This keeps the load from immediately triggering a redundant save.
  enabled: boolean;
  // Debounce window in milliseconds between the last change and the save.
  debounceMs?: number;
}

export function useCanvasAutosave({
  projectId,
  nodes,
  edges,
  enabled,
  debounceMs = 1500,
}: UseCanvasAutosaveOptions): CanvasAutosave {
  const [status, setStatus] = useState<SaveStatus>("idle");
  // Skip the first run after autosave becomes enabled so the baseline canvas
  // (whatever was loaded/synced) is not written straight back to the blob.
  const skipBaseline = useRef(true);

  // Keep the latest canvas in refs so `save` stays referentially stable while
  // still persisting up-to-date data. A monotonic sequence guards against an
  // older in-flight save overwriting the status of a newer one.
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;
  const saveSeq = useRef(0);

  const save = useCallback(async () => {
    const seq = ++saveSeq.current;
    setStatus("saving");
    try {
      const response = await fetch(`/api/projects/${projectId}/canvas`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: nodesRef.current, edges: edgesRef.current }),
      });
      if (seq === saveSeq.current) setStatus(response.ok ? "saved" : "error");
    } catch {
      if (seq === saveSeq.current) setStatus("error");
    }
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return;
    if (skipBaseline.current) {
      skipBaseline.current = false;
      return;
    }

    const timer = setTimeout(() => {
      void save();
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [enabled, nodes, edges, debounceMs, save]);

  return { status, save };
}
