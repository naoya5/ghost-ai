"use client";

import { createContext, useContext, useMemo } from "react";

import { CreateProjectDialog } from "@/components/editor/dialogs/create-project-dialog";
import { DeleteProjectDialog } from "@/components/editor/dialogs/delete-project-dialog";
import { RenameProjectDialog } from "@/components/editor/dialogs/rename-project-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
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
  ownedProjects: Project[];
  sharedProjects: Project[];
  children: React.ReactNode;
}

export function ProjectsProvider({
  ownedProjects,
  sharedProjects,
  children,
}: ProjectsProviderProps) {
  const actions = useProjectActions();

  const value = useMemo<ProjectsContextValue>(
    () => ({
      ownedProjects,
      sharedProjects,
      openCreate: actions.openCreate,
      openRename: actions.openRename,
      openDelete: actions.openDelete,
    }),
    [
      ownedProjects,
      sharedProjects,
      actions.openCreate,
      actions.openRename,
      actions.openDelete,
    ],
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
      <CreateProjectDialog
        isOpen={actions.isCreateOpen}
        isSubmitting={actions.isSubmitting}
        name={actions.name}
        roomId={actions.roomId}
        onNameChange={actions.setName}
        onClose={actions.close}
        onSubmit={actions.submitCreate}
      />
      <RenameProjectDialog
        isOpen={actions.isRenameOpen}
        project={actions.activeProject}
        isSubmitting={actions.isSubmitting}
        name={actions.name}
        onNameChange={actions.setName}
        onClose={actions.close}
        onSubmit={actions.submitRename}
      />
      <DeleteProjectDialog
        isOpen={actions.isDeleteOpen}
        project={actions.activeProject}
        isSubmitting={actions.isSubmitting}
        onClose={actions.close}
        onSubmit={actions.submitDelete}
      />
    </ProjectsContext.Provider>
  );
}
