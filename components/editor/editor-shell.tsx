"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { AiSidebar } from "@/components/editor/ai-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectsProvider } from "@/components/editor/projects-provider";
import { ShareDialog } from "@/components/editor/dialogs/share-dialog";
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
  const [isShareOpen, setIsShareOpen] = useState(false);

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

  return (
    <ProjectsProvider
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    >
      <div className="flex h-svh flex-col bg-base">
        <EditorNavbar
          currentProject={currentProject}
          isProjectsSidebarOpen={isProjectsSidebarOpen}
          onToggleProjectsSidebar={() =>
            setIsProjectsSidebarOpen((prev) => !prev)
          }
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((prev) => !prev)}
          onOpenShare={() => setIsShareOpen(true)}
        />
        <ProjectSidebar
          isOpen={isProjectsSidebarOpen}
          onClose={() => setIsProjectsSidebarOpen(false)}
          currentProjectId={currentProjectId}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
          {currentProject ? (
            <AiSidebar
              isOpen={isAiSidebarOpen}
              onClose={() => setIsAiSidebarOpen(false)}
            />
          ) : null}
        </div>
      </div>
      <ShareDialog
        isOpen={isShareOpen && currentProject !== null}
        project={currentProject}
        canManage={currentProject?.ownership === "owner"}
        onClose={() => setIsShareOpen(false)}
      />
    </ProjectsProvider>
  );
}
