"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

import { useCanvasSave } from "./canvas-save-context";

// How long the resolved "Saved"/"Error" label lingers before falling back to
// the default "Save" label.
const REVERT_MS = 2000;

export function NavbarSaveButton() {
  const { status, save } = useCanvasSave();
  // The resolved "Saved"/"Error" label lingers, then the label reverts to
  // "Save". Showing the label is derived from `status`; this flag only hides it
  // once the linger window elapses. It resets on cleanup when `status` changes,
  // so the next save cycle shows its outcome again.
  const [hideResolved, setHideResolved] = useState(false);

  useEffect(() => {
    if (status !== "saved" && status !== "error") return;
    const timer = setTimeout(() => setHideResolved(true), REVERT_MS);
    return () => {
      clearTimeout(timer);
      setHideResolved(false);
    };
  }, [status]);

  let label = "Save";
  if (status === "saving") {
    label = "Saving...";
  } else if (status === "saved" && !hideResolved) {
    label = "Saved";
  } else if (status === "error" && !hideResolved) {
    label = "Error";
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label="Save canvas"
      onClick={save}
      disabled={status === "saving"}
    >
      {label}
    </Button>
  );
}
