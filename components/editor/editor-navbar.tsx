"use client";

import {
  LayoutTemplateIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  Share2Icon,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { NavbarSaveButton } from "@/components/editor/canvas/navbar-save-button";
import type { Project } from "@/types/project";

interface EditorNavbarProps {
  currentProject: Project | null;
  // True on a project workspace route, false on the editor home. Controls
  // workspace-only navbar affordances (Save button) and hides the UserButton,
  // which is shown only on the editor home navbar.
  isWorkspace: boolean;
  isProjectsSidebarOpen: boolean;
  onToggleProjectsSidebar: () => void;
  isAiSidebarOpen: boolean;
  onToggleAiSidebar: () => void;
  onOpenShare: () => void;
  onOpenTemplates: () => void;
}

export function EditorNavbar({
  currentProject,
  isWorkspace,
  isProjectsSidebarOpen,
  onToggleProjectsSidebar,
  isAiSidebarOpen,
  onToggleAiSidebar,
  onOpenShare,
  onOpenTemplates,
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
        {isWorkspace ? <NavbarSaveButton /> : null}
        {currentProject ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Starter templates"
              onClick={onOpenTemplates}
            >
              <LayoutTemplateIcon />
              Templates
            </Button>
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
        {isWorkspace ? null : <UserButton />}
      </div>
    </header>
  );
}
