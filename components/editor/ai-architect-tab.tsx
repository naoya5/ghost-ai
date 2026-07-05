"use client";

import { useUpdateMyPresence } from "@liveblocks/react/suspense";
import { BotIcon, Loader2Icon, SendHorizontalIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiStatusFeed } from "@/hooks/useAiStatusFeed";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "Design an e-commerce backend",
  "Create a chat app architecture",
  "Build a CI/CD pipeline",
];

interface AiArchitectTabProps {
  // The project id doubles as the Liveblocks room id (see architecture-context).
  projectId: string;
}

export function AiArchitectTab({ projectId }: AiArchitectTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messageCounter = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Shared generation state. `isActive` reflects the room-wide `ai-status-feed`,
  // so the input/send button lock for *everyone* while a generation is running.
  const { isActive, publish } = useAiStatusFeed();
  const updateMyPresence = useUpdateMyPresence();

  // Local submit spans the round-trip to publish the shared status; combine with
  // the shared flag so the submitting user's controls lock instantly.
  const isBusy = isActive || isSubmitting;

  const addMessage = (role: ChatMessage["role"], content: string) => {
    messageCounter.current += 1;
    setMessages((prev) => [
      ...prev,
      { id: `msg-${messageCounter.current}`, role, content },
    ]);
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isBusy) return;

    addMessage("user", content);
    setInput("");
    setIsSubmitting(true);

    // Publish the shared AI activity signal: everyone in the room sees the
    // status feed light up and this participant's cursor gains a thinking
    // spinner. Cleared in `finally` so the room returns to idle.
    publish({ text: "Ghost AI is designing your architecture…" });
    updateMyPresence({ thinking: true });

    // Kick off the durable design run. The canvas updates (and AI presence /
    // status) arrive live through Liveblocks, so this call only needs to start
    // the run — the result is not awaited here.
    try {
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content, roomId: projectId, projectId }),
      });
      if (!response.ok) {
        addMessage(
          "assistant",
          "I couldn't start that design. Please try again.",
        );
      } else {
        addMessage(
          "assistant",
          "On it — I'm drawing your architecture on the canvas now. Watch it appear live.",
        );
      }
    } catch {
      addMessage("assistant", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      publish(null);
      updateMyPresence({ thinking: false });
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
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
                    message.role === "user"
                      ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                      : "border border-surface-border bg-elevated text-accent-ai-text",
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-surface-border p-3">
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
