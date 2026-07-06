"use client";

import { createContext, useContext } from "react";

interface AiSidebarContextValue {
  isOpen: boolean;
  close: () => void;
}

const AiSidebarContext = createContext<AiSidebarContextValue | null>(null);

export function AiSidebarProvider({
  value,
  children,
}: {
  value: AiSidebarContextValue;
  children: React.ReactNode;
}) {
  return (
    <AiSidebarContext.Provider value={value}>
      {children}
    </AiSidebarContext.Provider>
  );
}

/**
 * Access the AI sidebar open state from inside the Liveblocks room. The sidebar
 * is mounted within the canvas room (not the shell) so it can read the shared
 * `ai-status-feed` and presence; the navbar toggle still owns the open state and
 * passes it down through this context. Returns `null` outside a provider (e.g.
 * the `/editor` empty state), so consumers can opt out of rendering the sidebar.
 */
export function useAiSidebar(): AiSidebarContextValue | null {
  return useContext(AiSidebarContext);
}
