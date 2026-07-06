"use client";

import { useEffect, useState } from "react";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SpecSummary {
  id: string;
  filename: string;
  createdAt: string;
}

interface SpecPreviewDialogProps {
  projectId: string;
  spec: SpecSummary | null;
  onClose: () => void;
  onDownload: (spec: SpecSummary) => void;
}

// Renders a spec's Markdown content in a modal. The content is fetched through
// the existing download route (which reads the private blob server-side) rather
// than touching Vercel Blob from the client; the attachment header does not
// affect a `fetch()` reading the body as text.
export function SpecPreviewDialog({
  projectId,
  spec,
  onClose,
  onDownload,
}: SpecPreviewDialogProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spec) {
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setContent(null);
      setError(null);
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(spec.id)}/download`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        setContent(await response.text());
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          cause instanceof Error ? cause.message : "Failed to load spec",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [projectId, spec]);

  return (
    <Dialog
      open={spec !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex max-h-[80vh] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{spec?.filename}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="min-h-0 flex-1 rounded-xl border border-surface-border bg-elevated">
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-copy-muted">
                <Loader2Icon className="h-4 w-4 animate-spin" />
                Loading spec…
              </div>
            ) : error ? (
              <p role="alert" className="text-sm text-state-error">
                {error}
              </p>
            ) : (
              <div className="text-sm leading-relaxed text-copy-primary [&_a]:text-accent-ai-text [&_a]:underline [&_code]:rounded [&_code]:bg-subtle [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:first:mt-0 [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-sm [&_h3]:font-semibold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-subtle [&_pre]:p-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown>{content ?? ""}</ReactMarkdown>
              </div>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={spec === null}
            onClick={() => spec && onDownload(spec)}
          >
            <DownloadIcon />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
