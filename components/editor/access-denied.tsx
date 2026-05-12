import Link from "next/link";
import { LockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AccessDenied() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-surface-border bg-elevated text-copy-muted">
        <LockIcon className="h-8 w-8" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-copy-primary">
          You don&apos;t have access to this project
        </h1>
        <p className="text-sm text-copy-muted">
          It may have been removed, or you may need an invite from the owner.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/editor">Back to projects</Link>
      </Button>
    </main>
  );
}
