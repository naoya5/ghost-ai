"use client";

import { useSelf } from "@liveblocks/react/suspense";
import { MessagesSquareIcon, SendHorizontalIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAiChatFeed } from "@/hooks/useAiChatFeed";
import { cn } from "@/lib/utils";

// Format an epoch-ms timestamp as a short local time (e.g. "14:03"). Rendered
// client-only (the sidebar lives inside `ClientSideSuspense`), so there is no
// SSR/CSR hydration mismatch to worry about.
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Collaborative room chat. Reads and writes the shared `ai-chat` Liveblocks feed
// so every participant in the room sees the same conversation in realtime. This
// is human-to-human chat only — no AI replies and no backend AI tasks.
export function ChatTab() {
  const { messages, send } = useAiChatFeed();
  const self = useSelf((me) => me.info);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendMessage = () => {
    const content = input.trim();
    if (!content) return;

    try {
      send({
        id: crypto.randomUUID(),
        sender: self?.name ?? "Anonymous",
        role: "user",
        content,
        timestamp: Date.now(),
      });
      setInput("");
      setError(null);
    } catch {
      setError("Couldn't send your message. Please try again.");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-subtle">
              <MessagesSquareIcon className="h-6 w-6 text-accent-ai-text" />
            </div>
            <p className="max-w-[16rem] text-sm text-copy-muted">
              No messages yet. Say hello to everyone in the room.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const isOwn = message.sender === self?.name;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1",
                    isOwn ? "items-end" : "items-start",
                  )}
                >
                  <div className="flex items-center gap-2 px-1 text-[11px] text-copy-muted">
                    <span className="font-medium text-copy-secondary">
                      {message.sender}
                    </span>
                    <span>{formatTime(message.timestamp)}</span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap",
                      isOwn
                        ? "border-2 border-brand/50 bg-accent-dim text-copy-primary"
                        : "border border-surface-border bg-elevated text-copy-primary",
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="shrink-0 border-t border-surface-border p-3">
        {error ? (
          <p role="alert" className="mb-2 px-1 text-xs text-state-error">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the room…"
            className="max-h-40 min-h-[72px] resize-none overflow-y-auto"
          />
          <Button
            type="button"
            size="icon"
            aria-label="Send message"
            onClick={sendMessage}
            disabled={input.trim().length === 0}
            className="bg-accent-ai text-white hover:bg-accent-ai/90"
          >
            <SendHorizontalIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
