"use client";

import { useCallback, useState } from "react";

import type { Project } from "@/types/project";

export type ProjectDialogKind = "create" | "rename" | "delete" | null;

export interface UseProjectDialogsOptions {
  onCreate: (name: string) => Promise<void> | void;
  onRename: (project: Project, name: string) => Promise<void> | void;
  onDelete: (project: Project) => Promise<void> | void;
}

export interface UseProjectDialogsResult {
  openDialog: ProjectDialogKind;
  activeProject: Project | null;
  isCreateOpen: boolean;
  isRenameOpen: boolean;
  isDeleteOpen: boolean;
  name: string;
  setName: (value: string) => void;
  isSubmitting: boolean;
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
  close: () => void;
  submitCreate: () => Promise<void>;
  submitRename: () => Promise<void>;
  submitDelete: () => Promise<void>;
}

export function useProjectDialogs(
  options: UseProjectDialogsOptions,
): UseProjectDialogsResult {
  const [openDialog, setOpenDialog] = useState<ProjectDialogKind>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setOpenDialog(null);
    setActiveProject(null);
    setName("");
  }, []);

  const close = useCallback(() => {
    if (isSubmitting) return;
    reset();
  }, [isSubmitting, reset]);

  const openCreate = useCallback(() => {
    setActiveProject(null);
    setName("");
    setOpenDialog("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setActiveProject(project);
    setName(project.name);
    setOpenDialog("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setActiveProject(project);
    setName("");
    setOpenDialog("delete");
  }, []);

  const submitCreate = useCallback(async () => {
    if (isSubmitting) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    setIsSubmitting(true);
    try {
      await options.onCreate(trimmed);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, name, options, reset]);

  const submitRename = useCallback(async () => {
    if (isSubmitting || !activeProject) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    setIsSubmitting(true);
    try {
      await options.onRename(activeProject, trimmed);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProject, isSubmitting, name, options, reset]);

  const submitDelete = useCallback(async () => {
    if (isSubmitting || !activeProject) return;
    setIsSubmitting(true);
    try {
      await options.onDelete(activeProject);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProject, isSubmitting, options, reset]);

  return {
    openDialog,
    activeProject,
    isCreateOpen: openDialog === "create",
    isRenameOpen: openDialog === "rename",
    isDeleteOpen: openDialog === "delete",
    name,
    setName,
    isSubmitting,
    openCreate,
    openRename,
    openDelete,
    close,
    submitCreate,
    submitRename,
    submitDelete,
  };
}
