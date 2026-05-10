"use client";

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

interface EditorNavbarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
}: EditorNavbarProps) {
  const ToggleIcon = isSidebarOpen ? PanelLeftCloseIcon : PanelLeftOpenIcon;
  const toggleLabel = isSidebarOpen ? "Close projects sidebar" : "Open projects sidebar";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex flex-1 items-center justify-start">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={toggleLabel}
          aria-pressed={isSidebarOpen}
          onClick={onToggleSidebar}
        >
          <ToggleIcon />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center" />
      <div className="flex flex-1 items-center justify-end">
        <UserButton />
      </div>
    </header>
  );
}
