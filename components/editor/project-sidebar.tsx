"use client";

import {
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";

import { useProjects } from "@/components/editor/projects-provider";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const {
    ownedProjects,
    sharedProjects,
    openCreate,
    openRename,
    openDelete,
  } = useProjects();

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/50 opacity-0 transition-opacity duration-200 md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none",
        )}
      />

      <aside
        aria-hidden={!isOpen}
        className={cn(
          "pointer-events-none fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-200 ease-out",
          isOpen && "pointer-events-auto translate-x-0",
        )}
      >
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-3">
          <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close projects sidebar"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </header>

        <Tabs
          defaultValue="mine"
          className="flex flex-1 flex-col gap-3 overflow-hidden p-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="mine" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="mine"
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <ProjectList
              projects={ownedProjects}
              emptyText="No projects yet."
              onRename={openRename}
              onDelete={openDelete}
            />
          </TabsContent>
          <TabsContent
            value="shared"
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <ProjectList
              projects={sharedProjects}
              emptyText="No shared projects yet."
            />
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-3">
          <Button className="w-full" onClick={openCreate}>
            <PlusIcon />
            New Project
          </Button>
        </div>
      </aside>
    </>
  );
}

interface ProjectListProps {
  projects: Project[];
  emptyText: string;
  onRename?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

function ProjectList({
  projects,
  emptyText,
  onRename,
  onDelete,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-2 text-center text-xs text-copy-muted">
        {emptyText}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {projects.map((project) => (
        <li key={project.id}>
          <ProjectRow
            project={project}
            onRename={onRename}
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}

interface ProjectRowProps {
  project: Project;
  onRename?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

function ProjectRow({ project, onRename, onDelete }: ProjectRowProps) {
  const showActions = Boolean(onRename && onDelete);

  return (
    <div className="group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-elevated">
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-col items-start text-left"
      >
        <span className="w-full truncate text-sm text-copy-primary">
          {project.name}
        </span>
        <span className="w-full truncate font-mono text-[11px] text-copy-muted">
          {project.slug}
        </span>
      </button>
      {showActions && onRename && onDelete && (
        <div className="flex items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Rename ${project.name}`}
            onClick={() => onRename(project)}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete ${project.name}`}
            onClick={() => onDelete(project)}
          >
            <Trash2Icon />
          </Button>
        </div>
      )}
    </div>
  );
}
