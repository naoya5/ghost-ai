"use client";

import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface ProjectSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  return (
    <aside
      aria-hidden={!isOpen}
      className={cn(
        "pointer-events-none fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-surface-border bg-surface/95 backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen && "pointer-events-auto translate-x-0",
      )}
    >
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-surface-border px-3">
        <h2 className="text-sm font-semibold text-copy-primary">Projects</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close projects sidebar"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </header>

      <Tabs
        defaultValue="mine"
        className="flex flex-1 flex-col gap-3 overflow-hidden p-3"
      >
        <TabsList className="w-full">
          <TabsTrigger value="mine" className="flex-1">
            My Projects
          </TabsTrigger>
          <TabsTrigger value="shared" className="flex-1">
            Shared
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="mine"
          className="flex flex-1 items-center justify-center px-2 text-center text-xs text-copy-muted"
        >
          No projects yet.
        </TabsContent>
        <TabsContent
          value="shared"
          className="flex flex-1 items-center justify-center px-2 text-center text-xs text-copy-muted"
        >
          No shared projects yet.
        </TabsContent>
      </Tabs>

      <div className="border-t border-surface-border p-3">
        <Button className="w-full">
          <PlusIcon />
          New Project
        </Button>
      </div>
    </aside>
  );
}
