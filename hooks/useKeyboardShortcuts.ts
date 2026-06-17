"use client";

import { useEffect } from "react";

interface ZoomControls {
  zoomIn: (options?: { duration?: number }) => void;
  zoomOut: (options?: { duration?: number }) => void;
}

interface UseKeyboardShortcutsOptions {
  reactFlow: ZoomControls | null;
  onUndo: () => void;
  onRedo: () => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts({
  reactFlow,
  onUndo,
  onRedo,
}: UseKeyboardShortcutsOptions): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (isEditableTarget(event.target)) return;

      const isMeta = event.metaKey || event.ctrlKey;

      // Zoom in: + or =
      if (!isMeta && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        reactFlow?.zoomIn({ duration: 200 });
        return;
      }

      // Zoom out: -
      if (!isMeta && event.key === "-") {
        event.preventDefault();
        reactFlow?.zoomOut({ duration: 200 });
        return;
      }

      // Redo: Cmd/Ctrl + Shift + Z
      if (isMeta && event.shiftKey && event.code === "KeyZ") {
        event.preventDefault();
        onRedo();
        return;
      }

      // Redo: Cmd/Ctrl + Y
      if (isMeta && !event.shiftKey && event.code === "KeyY") {
        event.preventDefault();
        onRedo();
        return;
      }

      // Undo: Cmd/Ctrl + Z
      if (isMeta && !event.shiftKey && event.code === "KeyZ") {
        event.preventDefault();
        onUndo();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [reactFlow, onUndo, onRedo]);
}
