"use client";

import { useCallback, useEffect, useState } from "react";
import { useEdges, useNodes } from "@xyflow/react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import {
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SpecPreviewDialog,
  type SpecSummary,
} from "@/components/editor/spec-preview-dialog";
import { useAiChatFeed } from "@/hooks/useAiChatFeed";
import type { generateSpec } from "@/trigger/generate-spec";

interface SpecsTabProps {
  projectId: string;
}

// The scoped run subscription for an in-flight spec generation: the durable
// run id plus the public token minted for it. `null` when idle. Mirrors the
// `ActiveRun` shape in `ai-architect-tab.tsx`.
interface ActiveRun {
  runId: string;
  publicToken: string;
}

// Triggers a browser download of a spec through the existing download route.
// The route sets `Content-Disposition: attachment`, so navigating to it lets
// the browser handle the file download (auth flows through the session cookie).
function downloadSpec(projectId: string, spec: SpecSummary) {
  const anchor = document.createElement("a");
  anchor.href = `/api/projects/${encodeURIComponent(projectId)}/specs/${encodeURIComponent(spec.id)}/download`;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function SpecsTab({ projectId }: SpecsTabProps) {
  const [specs, setSpecs] = useState<SpecSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SpecSummary | null>(null);
  const [activeRun, setActiveRun] = useState<ActiveRun | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // The current canvas + chat, read live from the same Liveblocks-backed
  // React Flow instance the AI Architect tab draws on (this tab is mounted
  // inside the same `ReactFlowProvider`, see `flow-canvas.tsx`), so a
  // generated spec is grounded in what's actually on the canvas right now.
  const nodes = useNodes();
  const edges = useEdges();
  const { messages } = useAiChatFeed();

  const isGenerating = activeRun !== null;

  // Shared fetch logic for the specs list, factored out so the post-generation
  // refresh (triggered from `onComplete` below, not an effect) can reuse it.
  const loadSpecs = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/specs`,
          { signal },
        );
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        const data = (await response.json()) as { specs: SpecSummary[] };
        setSpecs(data.specs);
      } catch (cause) {
        if (signal?.aborted) {
          return;
        }
        setError(
          cause instanceof Error ? cause.message : "Failed to load specs",
        );
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    const controller = new AbortController();

    // Call the shared loader through a locally-defined async function (rather
    // than invoking `loadSpecs` directly) so this stays the same shape as a
    // plain effect-owned fetch — matches the project's existing convention.
    const load = () => loadSpecs(controller.signal);
    void load();

    return () => controller.abort();
  }, [loadSpecs]);

  // Subscribe to the durable spec-generation run. `enabled` is false until we
  // have both a run id and its scoped token, so the hook never fires without
  // credentials (mirrors `ai-architect-tab.tsx`).
  useRealtimeRun<typeof generateSpec>(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: activeRun !== null,
    onComplete: (run, error) => {
      if (error || run.isFailed || run.isCancelled) {
        setGenerateError("Spec generation failed. Please try again.");
      } else {
        void loadSpecs();
      }
      setActiveRun(null);
    },
  });

  const handleGenerate = useCallback(async () => {
    if (isGenerating) return;
    setGenerateError(null);
    try {
      const response = await fetch("/api/ai/spec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: projectId,
          chatHistory: messages,
          nodes,
          edges,
        }),
      });
      if (!response.ok) throw new Error("Failed to start spec run");
      const { runId, publicToken } = (await response.json()) as {
        runId: string;
        publicToken: string;
      };
      setActiveRun({ runId, publicToken });
    } catch {
      setGenerateError("Couldn't start spec generation. Please try again.");
    }
  }, [isGenerating, projectId, messages, nodes, edges]);

  const handleDownload = useCallback(
    (spec: SpecSummary) => downloadSpec(projectId, spec),
    [projectId],
  );

  return (
    <div className="flex h-full flex-col gap-4 px-3 py-4">
      <Button
        type="button"
        onClick={() => void handleGenerate()}
        disabled={isGenerating}
        className="w-full bg-accent-ai text-white hover:bg-accent-ai/90"
      >
        {isGenerating ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <SparklesIcon />
        )}
        {isGenerating ? "Generating…" : "Generate Spec"}
      </Button>
      {generateError ? (
        <p role="alert" className="-mt-2 px-1 text-xs text-state-error">
          {generateError}
        </p>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center gap-2 px-1 text-sm text-copy-muted">
            <Loader2Icon className="h-4 w-4 animate-spin" />
            Loading specs…
          </div>
        ) : error ? (
          <p role="alert" className="px-1 text-sm text-state-error">
            {error}
          </p>
        ) : specs.length === 0 ? (
          <p className="px-1 text-sm text-copy-muted">
            No specs yet. Generated specs will appear here.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {specs.map((spec) => (
              <li key={spec.id}>
                <article className="rounded-2xl border border-surface-border bg-elevated p-3">
                  <button
                    type="button"
                    onClick={() => setSelected(spec)}
                    className="flex w-full items-start gap-3 text-left"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-subtle">
                      <FileTextIcon className="h-4.5 w-4.5 text-accent-ai-text" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-medium text-copy-primary">
                        {spec.filename}
                      </h3>
                      <p className="mt-0.5 text-xs text-copy-muted">
                        {new Date(spec.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </button>
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label={`Download ${spec.filename}`}
                      onClick={() => handleDownload(spec)}
                    >
                      <DownloadIcon />
                      Download
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
      <SpecPreviewDialog
        projectId={projectId}
        spec={selected}
        onClose={() => setSelected(null)}
        onDownload={handleDownload}
      />
    </div>
  );
}
