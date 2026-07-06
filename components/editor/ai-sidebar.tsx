"use client";

import { BotIcon, Loader2Icon, XIcon } from "lucide-react";

import { AiArchitectTab } from "@/components/editor/ai-architect-tab";
import { ChatTab } from "@/components/editor/chat-tab";
import { SpecsTab } from "@/components/editor/specs-tab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAiStatusFeed } from "@/hooks/useAiStatusFeed";
import { cn } from "@/lib/utils";

interface AiSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

const TAB_TRIGGER_CLASS =
  "flex-1 text-copy-muted data-active:bg-accent-ai/15 data-active:text-accent-ai-text dark:data-active:border-transparent dark:data-active:bg-accent-ai/15 dark:data-active:text-accent-ai-text";

export function AiSidebar({ isOpen, onClose, projectId }: AiSidebarProps) {
  // Shared AI activity, visible to everyone in the room. `isActive` is driven by
  // the `ai-status-feed` Storage entry, so a status set by any participant (or a
  // future background task) shows here for all of them.
  const { message, isActive } = useAiStatusFeed();

  return (
    <aside
      aria-hidden={!isOpen}
      inert={!isOpen}
      className={cn(
        "absolute inset-y-0 right-0 z-40 flex w-80 flex-col border-l border-surface-border bg-base/95 shadow-2xl backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "pointer-events-none translate-x-full",
      )}
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-surface-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-subtle">
            <BotIcon className="h-4 w-4 text-accent-ai-text" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-copy-primary">
              AI Workspace
            </h2>
            <p className="truncate text-xs text-copy-muted">
              Collaborate with Ghost AI
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close AI workspace"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </header>
      {isActive ? (
        <div
          role="status"
          aria-live="polite"
          className="flex shrink-0 items-center gap-2 border-b border-surface-border bg-accent-ai/10 px-3 py-2 text-xs font-medium text-accent-ai-text"
        >
          <Loader2Icon className="h-3.5 w-3.5 shrink-0 animate-spin" />
          <span className="truncate">
            {message?.text ?? "Ghost AI is working…"}
          </span>
        </div>
      ) : null}
      <Tabs
        defaultValue="architect"
        className="flex min-h-0 flex-1 flex-col gap-3 px-3 pt-3"
      >
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="architect" className={TAB_TRIGGER_CLASS}>
            AI Architect
          </TabsTrigger>
          <TabsTrigger value="chat" className={TAB_TRIGGER_CLASS}>
            Chat
          </TabsTrigger>
          <TabsTrigger value="specs" className={TAB_TRIGGER_CLASS}>
            Specs
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="architect"
          className="-mx-3 min-h-0 flex-1 overflow-hidden"
        >
          <AiArchitectTab projectId={projectId} />
        </TabsContent>
        <TabsContent
          value="chat"
          className="-mx-3 min-h-0 flex-1 overflow-hidden"
        >
          <ChatTab />
        </TabsContent>
        <TabsContent
          value="specs"
          className="-mx-3 min-h-0 flex-1 overflow-hidden"
        >
          <SpecsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </aside>
  );
}
