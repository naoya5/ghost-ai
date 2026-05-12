"use client";

import { PlusIcon } from "lucide-react";

import { useProjects } from "@/components/editor/projects-provider";
import { Button } from "@/components/ui/button";

export function NewProjectButton() {
  const { openCreate } = useProjects();
  return (
    <Button onClick={openCreate}>
      <PlusIcon />
      New Project
    </Button>
  );
}
