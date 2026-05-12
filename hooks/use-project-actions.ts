"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { toSlug } from "@/lib/slug";
import type { Project } from "@/types/project";

export type ProjectDialogKind = "create" | "rename" | "delete" | null;

const ROOM_ID_SUFFIX_LENGTH = 6;
const ROOM_ID_SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateRoomIdSuffix(): string {
  const bytes = new Uint8Array(ROOM_ID_SUFFIX_LENGTH);
  crypto.getRandomValues(bytes);
  let result = "";
  for (const byte of bytes) {
    result += ROOM_ID_SUFFIX_ALPHABET[byte % ROOM_ID_SUFFIX_ALPHABET.length];
  }
  return result;
}

function composeRoomId(name: string, suffix: string): string {
  const slug = toSlug(name);
  if (!slug || !suffix) return "";
  return `${slug}-${suffix}`;
}

export interface UseProjectActionsResult {
  openDialog: ProjectDialogKind;
  activeProject: Project | null;
  isCreateOpen: boolean;
  isRenameOpen: boolean;
  isDeleteOpen: boolean;
  name: string;
  setName: (value: string) => void;
  roomId: string;
  isSubmitting: boolean;
  openCreate: () => void;
  openRename: (project: Project) => void;
  openDelete: (project: Project) => void;
  close: () => void;
  submitCreate: () => Promise<void>;
  submitRename: () => Promise<void>;
  submitDelete: () => Promise<void>;
}

export function useProjectActions(): UseProjectActionsResult {
  const router = useRouter();
  const pathname = usePathname();

  const [openDialog, setOpenDialog] = useState<ProjectDialogKind>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roomId = useMemo(() => composeRoomId(name, suffix), [name, suffix]);

  const reset = useCallback(() => {
    setOpenDialog(null);
    setActiveProject(null);
    setName("");
    setSuffix("");
  }, []);

  const close = useCallback(() => {
    if (isSubmitting) return;
    reset();
  }, [isSubmitting, reset]);

  const openCreate = useCallback(() => {
    setActiveProject(null);
    setName("");
    setSuffix(generateRoomIdSuffix());
    setOpenDialog("create");
  }, []);

  const openRename = useCallback((project: Project) => {
    setActiveProject(project);
    setName(project.name);
    setSuffix("");
    setOpenDialog("rename");
  }, []);

  const openDelete = useCallback((project: Project) => {
    setActiveProject(project);
    setName("");
    setSuffix("");
    setOpenDialog("delete");
  }, []);

  const submitCreate = useCallback(async () => {
    if (isSubmitting) return;
    const trimmed = name.trim();
    if (!trimmed || !roomId) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: roomId, name: trimmed }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.status}`);
      }
      const data = (await response.json()) as { project: { id: string } };
      reset();
      router.push(`/editor/${data.project.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, name, reset, roomId, router]);

  const submitRename = useCallback(async () => {
    if (isSubmitting || !activeProject) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === activeProject.name) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(activeProject.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to rename project: ${response.status}`);
      }
      reset();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProject, isSubmitting, name, reset, router]);

  const submitDelete = useCallback(async () => {
    if (isSubmitting || !activeProject) return;
    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(activeProject.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.status}`);
      }
      const deletedId = activeProject.id;
      const editingDeleted =
        pathname === `/editor/${deletedId}` ||
        pathname?.startsWith(`/editor/${deletedId}/`) === true;
      reset();
      if (editingDeleted) {
        router.push("/editor");
      } else {
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [activeProject, isSubmitting, pathname, reset, router]);

  return {
    openDialog,
    activeProject,
    isCreateOpen: openDialog === "create",
    isRenameOpen: openDialog === "rename",
    isDeleteOpen: openDialog === "delete",
    name,
    setName,
    roomId,
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
