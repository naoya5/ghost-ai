"use client";

import { createContext, useContext } from "react";

interface TemplatesContextValue {
  isOpen: boolean;
  close: () => void;
}

const TemplatesContext = createContext<TemplatesContextValue | null>(null);

export function TemplatesProvider({
  value,
  children,
}: {
  value: TemplatesContextValue;
  children: React.ReactNode;
}) {
  return (
    <TemplatesContext.Provider value={value}>
      {children}
    </TemplatesContext.Provider>
  );
}

/**
 * Access the starter-templates modal state from inside the Liveblocks room.
 * Returns `null` outside a `TemplatesProvider` (e.g. the `/editor` empty
 * state), so consumers can opt out of rendering the templates UI.
 */
export function useTemplates(): TemplatesContextValue | null {
  return useContext(TemplatesContext);
}
