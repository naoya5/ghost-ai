"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { CreateProjectDialog } from "@/components/editor/dialogs/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/dialogs/delete-project-dialog";
import { RenameProjectDialog } from "@/components/editor/dialogs/rename-project-dialog";
import { useProjectDialogs } from "@/hooks/use-project-dialogs";
import { MOCK_PROJECTS } from "@/lib/mock-projects";
import { toSlug } from "@/lib/slug";
import type { Project } from "@/types/project";

interface ProjectsContextValue {
  ownedProjects: Project[];
  sharedProjects: Project[];
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function useProjects(): ProjectsContextValue {
  const value = useContext(ProjectsContext);
  if (!value) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return value;
}

interface ProjectsProviderProps {
  children: React.ReactNode;
}

export function ProjectsProvider({ children }: ProjectsProviderProps) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);

  const handleCreate = useCallback(async (name: string) => {
    const slug = toSlug(name);
    if (!slug) return;
    const newProject: Project = {
      id: `p_${crypto.randomUUID()}`,
      name,
      slug,
      ownership: "owner",
    };
    setProjects((prev) => [newProject, ...prev]);
  }, []);

  const handleRename = useCallback(
    async (project: Project, name: string) => {
      const slug = toSlug(name);
      if (!slug) return;
      if (name === project.name && slug === project.slug) return;
      setProjects((prev) =>
        prev.map((item) =>
          item.id === project.id ? { ...item, name, slug } : item,
        ),
      );
    },
    [],
  );

  const handleDelete = useCallback(async (project: Project) => {
    setProjects((prev) => prev.filter((item) => item.id !== project.id));
  }, []);

  const dialogs = useProjectDialogs({
    onCreate: handleCreate,
    onRename: handleRename,
    onDelete: handleDelete,
  });

  const ownedProjects = useMemo(
    () => projects.filter((project) => project.ownership === "owner"),
    [projects],
  );
  const sharedProjects = useMemo(
    () => projects.filter((project) => project.ownership === "collaborator"),
    [projects],
  );

  const value = useMemo<ProjectsContextValue>(
    () => ({
      ownedProjects,
      sharedProjects,
      openCreate: dialogs.openCreate,
      openRename: dialogs.openRename,
      openDelete: dialogs.openDelete,
    }),
    [
      ownedProjects,
      sharedProjects,
      dialogs.openCreate,
      dialogs.openRename,
      dialogs.openDelete,
    ],
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
      <CreateProjectDialog
        isOpen={dialogs.isCreateOpen}
        isSubmitting={dialogs.isSubmitting}
        name={dialogs.name}
        onNameChange={dialogs.setName}
        onClose={dialogs.close}
        onSubmit={dialogs.submitCreate}
      />
      <RenameProjectDialog
        isOpen={dialogs.isRenameOpen}
        project={dialogs.activeProject}
        isSubmitting={dialogs.isSubmitting}
        name={dialogs.name}
        onNameChange={dialogs.setName}
        onClose={dialogs.close}
        onSubmit={dialogs.submitRename}
      />
      <DeleteProjectDialog
        isOpen={dialogs.isDeleteOpen}
        project={dialogs.activeProject}
        isSubmitting={dialogs.isSubmitting}
        onClose={dialogs.close}
        onSubmit={dialogs.submitDelete}
      />
    </ProjectsContext.Provider>
  );
}
