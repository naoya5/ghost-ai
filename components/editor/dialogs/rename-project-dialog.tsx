"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toSlug } from "@/lib/slug";
import type { Project } from "@/types/project";

interface RenameProjectDialogProps {
  isOpen: boolean;
  project: Project | null;
  isSubmitting: boolean;
  name: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function RenameProjectDialog({
  isOpen,
  project,
  isSubmitting,
  name,
  onNameChange,
  onClose,
  onSubmit,
}: RenameProjectDialogProps) {
  const trimmed = name.trim();
  const isValid =
    trimmed.length > 0 &&
    toSlug(trimmed).length > 0 &&
    (project ? trimmed !== project.name : true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid || isSubmitting) return;
    onSubmit();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Project</DialogTitle>
          <DialogDescription>
            Renaming{" "}
            <span className="font-medium text-copy-primary">
              {project?.name ?? ""}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="rename-project-name"
              className="text-xs font-medium text-copy-secondary"
            >
              Project name
            </label>
            <Input
              id="rename-project-name"
              autoFocus
              autoComplete="off"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
