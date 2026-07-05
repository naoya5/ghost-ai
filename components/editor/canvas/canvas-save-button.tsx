"use client";

import {
  AlertCircleIcon,
  CheckIcon,
  CloudIcon,
  Loader2Icon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/hooks/useCanvasAutosave";

interface CanvasSaveButtonProps {
  status: SaveStatus;
}

const STATUS_CONFIG: Record<
  SaveStatus,
  { label: string; icon: typeof CloudIcon; className: string; spin?: boolean }
> = {
  idle: {
    label: "Saved",
    icon: CloudIcon,
    className: "text-copy-muted",
  },
  saving: {
    label: "Saving…",
    icon: Loader2Icon,
    className: "text-copy-muted",
    spin: true,
  },
  saved: {
    label: "Saved",
    icon: CheckIcon,
    className: "text-brand",
  },
  error: {
    label: "Save failed",
    icon: AlertCircleIcon,
    className: "text-state-error",
  },
};

export function CanvasSaveButton({ status }: CanvasSaveButtonProps) {
  const { label, icon: Icon, className, spin } = STATUS_CONFIG[status];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-1.5 rounded-full border border-surface-border bg-surface/90 px-3 py-1.5 text-xs font-medium backdrop-blur-sm",
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", spin && "animate-spin")} />
      {label}
    </div>
  );
}
