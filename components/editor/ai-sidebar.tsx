"use client";

import { SparklesIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSidebar({ isOpen, onClose }: AiSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-surface-border bg-surface/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-accent-ai" />
          <h2 className="text-sm font-semibold text-copy-primary">
            AI Assistant
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI assistant"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 text-center text-xs text-copy-muted">
        AI chat coming soon.
      </div>
    </aside>
  );
}
