"use client";

import { useCallback, useEffect, useState } from "react";
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

interface SpecsTabProps {
  projectId: string;
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

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/specs`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error(`Request failed (${response.status})`);
        }
        const data = (await response.json()) as { specs: SpecSummary[] };
        setSpecs(data.specs);
      } catch (cause) {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          cause instanceof Error ? cause.message : "Failed to load specs",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [projectId]);

  const handleDownload = useCallback(
    (spec: SpecSummary) => downloadSpec(projectId, spec),
    [projectId],
  );

  return (
    <div className="flex h-full flex-col gap-4 px-3 py-4">
      <Button
        type="button"
        className="w-full bg-accent-ai text-white hover:bg-accent-ai/90"
      >
        <SparklesIcon />
        Generate Spec
      </Button>
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
