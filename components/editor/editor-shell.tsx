"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { AiSidebarProvider } from "@/components/editor/ai-sidebar-provider";
import { CanvasSaveProvider } from "@/components/editor/canvas/canvas-save-context";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectsProvider } from "@/components/editor/projects-provider";
import { ShareDialog } from "@/components/editor/dialogs/share-dialog";
import { TemplatesProvider } from "@/components/editor/templates-provider";
import type { Project } from "@/types/project";

interface EditorShellProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
  children: React.ReactNode;
}

const ROOM_PATH_PATTERN = /^\/editor\/([^/]+)/;

export function EditorShell({
  ownedProjects,
  sharedProjects,
  children,
}: EditorShellProps) {
  const pathname = usePathname();
  const [isProjectsSidebarOpen, setIsProjectsSidebarOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [shareOpenProjectId, setShareOpenProjectId] = useState<string | null>(
    null,
  );
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const currentProjectId = useMemo(() => {
    if (!pathname) return null;
    const match = pathname.match(ROOM_PATH_PATTERN);
    return match?.[1] ?? null;
  }, [pathname]);

  const currentProject = useMemo(() => {
    if (!currentProjectId) return null;
    return (
      ownedProjects.find((project) => project.id === currentProjectId) ??
      sharedProjects.find((project) => project.id === currentProjectId) ??
      null
    );
  }, [currentProjectId, ownedProjects, sharedProjects]);

  const isShareOpen =
    shareOpenProjectId !== null && shareOpenProjectId === currentProjectId;

  const templatesValue = useMemo(
    () => ({
      isOpen: isTemplatesOpen,
      close: () => setIsTemplatesOpen(false),
    }),
    [isTemplatesOpen],
  );

  const aiSidebarValue = useMemo(
    () => ({
      isOpen: isAiSidebarOpen,
      close: () => setIsAiSidebarOpen(false),
    }),
    [isAiSidebarOpen],
  );

  return (
    <ProjectsProvider
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    >
      <CanvasSaveProvider>
        <div className="flex h-svh flex-col bg-base">
        <EditorNavbar
          currentProject={currentProject}
          isWorkspace={currentProjectId !== null}
          isProjectsSidebarOpen={isProjectsSidebarOpen}
          onToggleProjectsSidebar={() =>
            setIsProjectsSidebarOpen((prev) => !prev)
          }
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((prev) => !prev)}
          onOpenShare={() => setShareOpenProjectId(currentProjectId)}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
        />
        <div className="relative flex-1 overflow-hidden">
          <div className="absolute inset-0 flex flex-col">
            {/* The AI sidebar is mounted inside the canvas room (see
                flow-canvas.tsx) so it can read the shared ai-status-feed and
                presence. The navbar toggle still owns the open state and passes
                it down through this provider. */}
            <AiSidebarProvider value={aiSidebarValue}>
              <TemplatesProvider value={templatesValue}>
                {children}
              </TemplatesProvider>
            </AiSidebarProvider>
          </div>
          <ProjectSidebar
            isOpen={isProjectsSidebarOpen}
            onClose={() => setIsProjectsSidebarOpen(false)}
            currentProjectId={currentProjectId}
          />
        </div>
      </div>
        <ShareDialog
          isOpen={isShareOpen && currentProject !== null}
          project={currentProject}
          canManage={currentProject?.ownership === "owner"}
          onClose={() => setShareOpenProjectId(null)}
        />
      </CanvasSaveProvider>
    </ProjectsProvider>
  );
}
