"use client";

import {
  Minus,
  Plus,
  Redo2,
  ScanSearch,
  Undo2,
} from "lucide-react";

interface ZoomFitControls {
  zoomIn: (options?: { duration?: number }) => void;
  zoomOut: (options?: { duration?: number }) => void;
  fitView: (options?: { duration?: number }) => void;
}

interface CanvasControlBarProps {
  reactFlow: ZoomFitControls;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  "aria-label": string;
  children: React.ReactNode;
}

function ControlButton({
  onClick,
  disabled = false,
  title,
  "aria-label": ariaLabel,
  children,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className="flex h-8 w-8 items-center justify-center rounded-full text-copy-secondary transition-colors hover:bg-elevated hover:text-copy-primary disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

export function CanvasControlBar({
  reactFlow,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: CanvasControlBarProps) {
  return (
    <div className="absolute bottom-6 left-6 z-10 flex items-center gap-0.5 rounded-full border border-surface-border bg-surface/90 p-1 shadow-lg backdrop-blur">
      {/* Zoom controls */}
      <ControlButton
        onClick={() => reactFlow.zoomOut({ duration: 200 })}
        title="Zoom out (−)"
        aria-label="Zoom out"
      >
        <Minus className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={() => reactFlow.fitView({ duration: 200 })}
        title="Fit view"
        aria-label="Fit view"
      >
        <ScanSearch className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={() => reactFlow.zoomIn({ duration: 200 })}
        title="Zoom in (+)"
        aria-label="Zoom in"
      >
        <Plus className="h-4 w-4" />
      </ControlButton>

      {/* Divider */}
      <div className="mx-1 h-4 w-px bg-surface-border" />

      {/* History controls */}
      <ControlButton
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (⌘Z)"
        aria-label="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (⌘⇧Z)"
        aria-label="Redo"
      >
        <Redo2 className="h-4 w-4" />
      </ControlButton>
    </div>
  );
}
