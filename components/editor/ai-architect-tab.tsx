"use client";

import { useSelf, useUpdateMyPresence } from "@liveblocks/react/suspense";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { BotIcon, Loader2Icon, SendHorizontalIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiChatFeed } from "@/hooks/useAiChatFeed";
import { useAiStatusFeed } from "@/hooks/useAiStatusFeed";
import { cn } from "@/lib/utils";
import type { ChatRole } from "@/types/tasks";
import type { designAgentTask } from "@/trigger/design-agent";

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

// The scoped run subscription: the durable design run plus the public token
// minted for it. `null` when no run is in flight.
interface ActiveRun {
  runId: string;
  publicToken: string;
}

interface AiArchitectTabProps {
  // The project id doubles as the Liveblocks room id (see architecture-context).
  projectId: string;
}

export function AiArchitectTab({ projectId }: AiArchitectTabProps) {
  const [input, setInput] = useState("");
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Synchronous guard against a double-submit race (e.g. rapid Enter presses)
  // — `isBusy` only updates after the first `await`, so state alone can't
  // block a second `sendMessage` call that starts within the same tick.
  const isSubmittingRef = useRef(false);

  // The conversation lives in the collaborative `ai-chat` feed, so user prompts
  // and the final AI reply sync across every session in the room.
  const { messages, send } = useAiChatFeed();
  const self = useSelf((me) => me.info);

  // Shared generation state. `message` is the latest `ai-status-feed` entry;
  // `isActive` reflects the room-wide flag, so the input/send button lock for
  // *everyone* while a generation is running.
  const { message, isActive, publish } = useAiStatusFeed();
  const updateMyPresence = useUpdateMyPresence();

  // A run this client kicked off is in flight from submit until `useRealtimeRun`
  // reports completion. Combine with the room-wide flag so the controls lock
  // instantly for the submitter and stay locked for everyone during the run.
  const isRunning = activeRun !== null;
  const isBusy = isActive || isRunning;

  const appendMessage = (role: ChatRole, content: string) => {
    try {
      send({
        id: crypto.randomUUID(),
        sender: role === "user" ? (self?.name ?? "You") : "Ghost AI",
        role,
        content,
        timestamp: Date.now(),
      });
    } catch {
      // A failed append should never wedge the run lifecycle; swallow it (the
      // status feed / canvas still reflect what happened).
    }
  };

  // Clear the run + shared status/presence back to idle.
  const resetRun = () => {
    setActiveRun(null);
    publish(null);
    updateMyPresence({ thinking: false });
  };

  // Subscribe to the durable run. `enabled` is false until we have both a run id
  // and its scoped token, so the hook never fires without credentials. On
  // completion we push the AI's closing message and reset shared state.
  useRealtimeRun<typeof designAgentTask>(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: activeRun !== null,
    onComplete: (run, error) => {
      if (error || run.isFailed || run.isCancelled) {
        appendMessage(
          "assistant",
          "The design run didn't finish. Please try again.",
        );
      } else {
        appendMessage(
          "assistant",
          "Done — your architecture is on the canvas. Watch it appear live.",
        );
      }
      resetRun();
    },
  });

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isBusy || isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    appendMessage("user", content);
    setInput("");

    // Light up the shared status feed + this participant's thinking cursor for
    // the whole run; cleared in `resetRun` once the run completes (or fails to
    // start below).
    publish({ text: "Ghost AI is designing your architecture…" });
    updateMyPresence({ thinking: true });

    try {
      // Start the durable design run. The route mints the run + its scoped
      // public token atomically, so a single response is all we need to
      // subscribe. Canvas updates arrive live via Liveblocks.
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId: projectId, projectId }),
      });
      if (!response.ok) throw new Error("Failed to start design run");
      const { runId, publicToken } = (await response.json()) as {
        runId: string;
        publicToken: string;
      };

      // Hand off to `useRealtimeRun`; `onComplete` finishes the conversation.
      setActiveRun({ runId, publicToken });
    } catch {
      appendMessage(
        "assistant",
        "I couldn't start that design. Please try again.",
      );
      resetRun();
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleChipClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
              <BotIcon className="h-6 w-6 text-accent-ai-text" />
            </div>
            <p className="max-w-[16rem] text-sm text-copy-muted">
              Describe the system you want to build and Ghost AI will architect
              it with you.
            </p>
            <div className="flex flex-col items-stretch gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleChipClick(prompt)}
                  className="rounded-full bg-subtle px-3 py-1.5 text-xs font-medium text-accent-ai-text transition-colors hover:bg-subtle/70"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((chatMessage) => (
              <div
                key={chatMessage.id}
                className={cn(
                  "flex",
                  chatMessage.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                    chatMessage.role === "user"
                      ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                      : "border border-surface-border bg-elevated text-accent-ai-text",
                  )}
                >
                  {chatMessage.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-surface-border p-3">
        {isBusy ? (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 flex items-center gap-2 rounded-lg border border-accent-ai/30 bg-accent-ai/10 px-2.5 py-1.5 text-xs font-medium text-accent-ai-text"
          >
            <Loader2Icon className="h-3.5 w-3.5 shrink-0 animate-spin" />
            <span className="truncate">
              {message?.text ?? "Ghost AI is working…"}
            </span>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder={
              isBusy ? "Ghost AI is working…" : "Describe your architecture…"
            }
            className="max-h-40 min-h-[72px] resize-none overflow-y-auto"
          />
          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            onClick={() => void sendMessage()}
            disabled={input.trim().length === 0 || isBusy}
            className="bg-accent-ai text-white hover:bg-accent-ai/90"
          >
            {isBusy ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <SendHorizontalIcon />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
