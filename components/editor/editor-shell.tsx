"use client";

import { useState } from "react";

import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ProjectsProvider } from "@/components/editor/projects-provider";
import type { Project } from "@/types/project";

interface EditorShellProps {
  ownedProjects: Project[];
  sharedProjects: Project[];
  children: React.ReactNode;
}

export function EditorShell({
  ownedProjects,
  sharedProjects,
  children,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ProjectsProvider
      ownedProjects={ownedProjects}
      sharedProjects={sharedProjects}
    >
      <EditorNavbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <ProjectSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      {children}
    </ProjectsProvider>
  );
}
