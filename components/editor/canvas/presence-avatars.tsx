"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useOthers } from "@liveblocks/react/suspense";

// Overlapping collaborator stack shown in the top-right of the canvas view.
// Collaborators come from Liveblocks presence; the current user is rendered
// once via the Clerk UserButton (never duplicated from the presence list).
const MAX_VISIBLE = 5;

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PresenceAvatars() {
  const { user } = useUser();
  const currentUserId = user?.id ?? null;
  const others = useOthers();

  // Exclude the current Clerk user, and dedupe by user id since one person may
  // be connected from multiple tabs — show a single avatar per collaborator.
  const collaborators: Collaborator[] = [];
  const seen = new Set<string>();
  for (const other of others) {
    const id = other.id;
    if (!id || id === currentUserId || seen.has(id)) continue;
    seen.add(id);
    collaborators.push({
      id,
      name: other.info?.name ?? "Guest",
      avatar: other.info?.avatar ?? "",
      color: other.info?.color ?? "#808090",
    });
  }

  const visible = collaborators.slice(0, MAX_VISIBLE);
  const overflow = collaborators.length - visible.length;
  const hasCollaborators = collaborators.length > 0;

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-30 flex items-center">
      {hasCollaborators ? (
        <div className="flex items-center -space-x-2">
          {visible.map((collaborator) => (
            <CollaboratorAvatar
              key={collaborator.id}
              collaborator={collaborator}
            />
          ))}
          {overflow > 0 ? (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full bg-elevated text-[10px] font-semibold text-copy-primary ring-2 ring-base"
              aria-label={`${overflow} more collaborator${overflow === 1 ? "" : "s"}`}
            >
              +{overflow}
            </div>
          ) : null}
        </div>
      ) : null}
      {hasCollaborators ? (
        <div className="mx-3 h-6 w-px shrink-0 bg-surface-border" aria-hidden />
      ) : null}
      <UserButton />
    </div>
  );
}

function CollaboratorAvatar({ collaborator }: { collaborator: Collaborator }) {
  const { name, avatar, color } = collaborator;
  return (
    <div
      // Display-only: not interactive, so it is a plain div (not a button).
      className="relative h-7 w-7 select-none overflow-hidden rounded-full ring-2 ring-base"
      title={name}
      aria-label={name}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white"
          style={{ backgroundColor: color }}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
}
