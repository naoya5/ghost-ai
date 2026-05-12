"use client";

import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  Share2Icon,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import type { Project } from "@/types/project";

interface EditorNavbarProps {
  currentProject: Project | null;
  isProjectsSidebarOpen: boolean;
  onToggleProjectsSidebar: () => void;
  isAiSidebarOpen: boolean;
  onToggleAiSidebar: () => void;
  onOpenShare: () => void;
}

export function EditorNavbar({
  currentProject,
  isProjectsSidebarOpen,
  onToggleProjectsSidebar,
  isAiSidebarOpen,
  onToggleAiSidebar,
  onOpenShare,
}: EditorNavbarProps) {
  const ProjectsToggleIcon = isProjectsSidebarOpen
    ? PanelLeftCloseIcon
    : PanelLeftOpenIcon;
  const projectsToggleLabel = isProjectsSidebarOpen
    ? "Close projects sidebar"
    : "Open projects sidebar";

  const AiToggleIcon = isAiSidebarOpen
    ? PanelRightCloseIcon
    : PanelRightOpenIcon;
  const aiToggleLabel = isAiSidebarOpen
    ? "Close AI assistant"
    : "Open AI assistant";

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-surface-border bg-surface px-3">
      <div className="flex flex-1 items-center justify-start">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={projectsToggleLabel}
          aria-pressed={isProjectsSidebarOpen}
          onClick={onToggleProjectsSidebar}
        >
          <ProjectsToggleIcon />
        </Button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        {currentProject ? (
          <span className="max-w-full truncate text-sm font-medium text-copy-primary">
            {currentProject.name}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-end gap-1">
        {currentProject ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Share project"
              onClick={onOpenShare}
            >
              <Share2Icon />
              Share
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={aiToggleLabel}
              aria-pressed={isAiSidebarOpen}
              onClick={onToggleAiSidebar}
            >
              <AiToggleIcon />
            </Button>
          </>
        ) : null}
        <UserButton />
      </div>
    </header>
  );
}
