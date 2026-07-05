"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { SaveStatus } from "@/hooks/useCanvasAutosave";

interface CanvasSaveContextValue {
  // Current autosave status, mirrored up from the active canvas.
  status: SaveStatus;
  // Trigger a manual save through the canvas' registered save handler. No-op
  // when no canvas is mounted (e.g. on the editor home navbar).
  save: () => void;
  // Called by the canvas to register/replace its save handler.
  registerSave: (handler: () => void) => void;
  // Called by the canvas on unmount to detach its handler.
  unregisterSave: (handler: () => void) => void;
  // Called by the canvas to push its autosave status up to the navbar.
  reportStatus: (status: SaveStatus) => void;
}

const CanvasSaveContext = createContext<CanvasSaveContextValue | null>(null);

// Bridges the workspace navbar (which owns the Save button) and the canvas
// (which owns the autosave hook), since they live in separate parts of the
// editor tree. Wraps both so either side can read status and trigger a save.
export function CanvasSaveProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const saveRef = useRef<(() => void) | null>(null);

  const registerSave = useCallback((handler: () => void) => {
    saveRef.current = handler;
  }, []);

  const unregisterSave = useCallback((handler: () => void) => {
    if (saveRef.current === handler) {
      saveRef.current = null;
      setStatus("idle");
    }
  }, []);

  const reportStatus = useCallback((next: SaveStatus) => {
    setStatus(next);
  }, []);

  const save = useCallback(() => {
    saveRef.current?.();
  }, []);

  const value = useMemo<CanvasSaveContextValue>(
    () => ({ status, save, registerSave, unregisterSave, reportStatus }),
    [status, save, registerSave, unregisterSave, reportStatus],
  );

  return (
    <CanvasSaveContext.Provider value={value}>
      {children}
    </CanvasSaveContext.Provider>
  );
}

export function useCanvasSave(): CanvasSaveContextValue {
  const ctx = useContext(CanvasSaveContext);
  if (!ctx) {
    throw new Error("useCanvasSave must be used within a CanvasSaveProvider");
  }
  return ctx;
}
