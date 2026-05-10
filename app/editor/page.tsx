"use client";

import { PlusIcon } from "lucide-react";

import { useProjects } from "@/components/editor/projects-provider";
import { Button } from "@/components/ui/button";

export default function EditorHome() {
  const { openCreate } = useProjects();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-copy-primary">
          Create a project or open an existing one
        </h1>
        <p className="text-sm text-copy-muted">
          Start a new architecture workspace, or choose a project from the
          sidebar.
        </p>
      </div>
      <Button onClick={openCreate}>
        <PlusIcon />
        New Project
      </Button>
    </main>
  );
}
