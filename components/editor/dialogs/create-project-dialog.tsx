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

interface CreateProjectDialogProps {
  isOpen: boolean;
  isSubmitting: boolean;
  name: string;
  roomId: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export function CreateProjectDialog({
  isOpen,
  isSubmitting,
  name,
  roomId,
  onNameChange,
  onClose,
  onSubmit,
}: CreateProjectDialogProps) {
  const isValid = roomId.length > 0;

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
          <DialogTitle>New Project</DialogTitle>
          <DialogDescription>
            Name your project to start a new architecture workspace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="create-project-name"
              className="text-xs font-medium text-copy-secondary"
            >
              Project name
            </label>
            <Input
              id="create-project-name"
              autoFocus
              autoComplete="off"
              placeholder="My architecture project"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-copy-secondary">
              Room ID preview
            </span>
            <div className="rounded-lg border border-surface-border bg-base px-2.5 py-1.5 font-mono text-xs text-copy-muted">
              {roomId || (
                <span className="text-copy-faint">your-project-room-id</span>
              )}
            </div>
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
              {isSubmitting ? "Creating..." : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
