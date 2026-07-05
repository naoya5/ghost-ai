"use client";

import { DownloadIcon, FileTextIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SpecsTab() {
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
        <article className="rounded-2xl border border-surface-border bg-elevated p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle">
              <FileTextIcon className="h-5 w-5 text-accent-ai-text" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-copy-primary">
                E-commerce Backend Spec
              </h3>
              <p className="mt-1 line-clamp-3 text-xs text-copy-muted">
                A service-oriented backend with product catalog, cart, checkout,
                and order fulfillment services backed by PostgreSQL and an event
                bus for async workflows.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              aria-label="Download spec"
            >
              <DownloadIcon />
              Download
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
