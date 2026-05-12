"use client";

import {
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Collaborator } from "@/types/collaborator";
import type { Project } from "@/types/project";

interface ShareDialogProps {
  isOpen: boolean;
  project: Project | null;
  canManage: boolean;
  onClose: () => void;
}

export function ShareDialog({
  isOpen,
  project,
  canManage,
  onClose,
}: ShareDialogProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removingEmail, setRemovingEmail] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen || !project) return;
    const controller = new AbortController();
    setIsLoading(true);
    setLoadError(null);
    fetch(`/api/projects/${encodeURIComponent(project.id)}/collaborators`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load (${response.status})`);
        }
        const data = (await response.json()) as {
          collaborators: Collaborator[];
        };
        if (controller.signal.aborted) return;
        setCollaborators(data.collaborators);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setLoadError("Failed to load collaborators.");
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setIsLoading(false);
      });
    return () => controller.abort();
  }, [isOpen, project]);

  useEffect(() => {
    if (isOpen) return;
    setEmailInput("");
    setInviteError(null);
    setCopied(false);
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleInvite = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!project || !canManage || isInviting) return;
      const trimmed = emailInput.trim();
      if (!trimmed) return;
      setIsInviting(true);
      setInviteError(null);
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(project.id)}/collaborators`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: trimmed }),
          },
        );
        if (!response.ok) {
          setInviteError(
            response.status === 400
              ? "Enter a valid email address."
              : "Failed to invite collaborator.",
          );
          return;
        }
        const data = (await response.json()) as {
          collaborators: Collaborator[];
        };
        setCollaborators(data.collaborators);
        setEmailInput("");
      } catch {
        setInviteError("Failed to invite collaborator.");
      } finally {
        setIsInviting(false);
      }
    },
    [canManage, emailInput, isInviting, project],
  );

  const handleRemove = useCallback(
    async (email: string) => {
      if (!project || !canManage || removingEmail) return;
      setRemovingEmail(email);
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(project.id)}/collaborators/${encodeURIComponent(email)}`,
          { method: "DELETE" },
        );
        if (!response.ok) {
          setInviteError("Failed to remove collaborator.");
          return;
        }
        setCollaborators((prev) =>
          prev.filter((collaborator) => collaborator.email !== email),
        );
      } catch {
        setInviteError("Failed to remove collaborator.");
      } finally {
        setRemovingEmail(null);
      }
    },
    [canManage, project, removingEmail],
  );

  const handleCopyLink = useCallback(async () => {
    if (!project || typeof window === "undefined") return;
    const url = `${window.location.origin}/editor/${encodeURIComponent(project.id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 2000);
    } catch {
      setInviteError("Failed to copy link.");
    }
  }, [project]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            {project ? (
              <>
                Invite collaborators to{" "}
                <span className="font-medium text-copy-primary">
                  {project.name}
                </span>
                .
              </>
            ) : (
              "Select a project to manage collaborators."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-copy-secondary">
              Project link
            </span>
            <div className="flex items-center gap-2">
              <div className="flex-1 truncate rounded-lg border border-surface-border bg-base px-2.5 py-1.5 font-mono text-xs text-copy-muted">
                {project ? `/editor/${project.id}` : "—"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                disabled={!project}
                aria-live="polite"
              >
                {copied ? (
                  <>
                    <CheckIcon />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {canManage ? (
            <form className="space-y-1.5" onSubmit={handleInvite}>
              <label
                htmlFor="share-invite-email"
                className="text-xs font-medium text-copy-secondary"
              >
                Invite by email
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="share-invite-email"
                  type="email"
                  autoComplete="off"
                  placeholder="teammate@example.com"
                  value={emailInput}
                  onChange={(event) => setEmailInput(event.target.value)}
                  disabled={isInviting}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isInviting || emailInput.trim().length === 0}
                >
                  {isInviting ? "Inviting..." : "Invite"}
                </Button>
              </div>
              {inviteError ? (
                <p className="text-xs text-state-error">{inviteError}</p>
              ) : null}
            </form>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-copy-secondary">
                Collaborators
              </span>
              <span className="text-xs text-copy-muted">
                {collaborators.length}
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-surface-border bg-base">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-3 py-6 text-xs text-copy-muted">
                  <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </div>
              ) : loadError ? (
                <div className="px-3 py-6 text-center text-xs text-state-error">
                  {loadError}
                </div>
              ) : collaborators.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-copy-muted">
                  No collaborators yet.
                </div>
              ) : (
                <ul className="divide-y divide-surface-border">
                  {collaborators.map((collaborator) => (
                    <li
                      key={collaborator.email}
                      className="flex items-center gap-3 px-3 py-2"
                    >
                      <CollaboratorAvatar collaborator={collaborator} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-copy-primary">
                          {collaborator.displayName ?? collaborator.email}
                        </p>
                        {collaborator.displayName ? (
                          <p className="truncate text-xs text-copy-muted">
                            {collaborator.email}
                          </p>
                        ) : null}
                      </div>
                      {canManage ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Remove ${collaborator.email}`}
                          disabled={removingEmail === collaborator.email}
                          onClick={() => handleRemove(collaborator.email)}
                        >
                          {removingEmail === collaborator.email ? (
                            <Loader2Icon className="animate-spin" />
                          ) : (
                            <Trash2Icon />
                          )}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CollaboratorAvatarProps {
  collaborator: Collaborator;
}

function CollaboratorAvatar({ collaborator }: CollaboratorAvatarProps) {
  const base =
    "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-surface-border bg-surface text-copy-muted";
  if (collaborator.imageUrl) {
    return (
      <span className={cn(base, "bg-base")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={collaborator.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span className={base}>
      <UserIcon className="h-3.5 w-3.5" />
    </span>
  );
}
