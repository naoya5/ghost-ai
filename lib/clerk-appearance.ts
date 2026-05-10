import { dark } from "@clerk/ui/themes";

export const clerkAppearance = {
  theme: dark,
  variables: {
    colorPrimary: "var(--accent-primary)",
    colorBackground: "var(--bg-elevated)",
    colorForeground: "var(--text-primary)",
    colorMuted: "var(--bg-subtle)",
    colorMutedForeground: "var(--text-muted)",
    colorInputBackground: "var(--bg-subtle)",
    colorInputForeground: "var(--text-primary)",
    colorBorder: "var(--border-default)",
    colorDanger: "var(--state-error)",
    colorSuccess: "var(--state-success)",
    colorWarning: "var(--state-warning)",
    colorRing: "var(--accent-primary)",
    fontFamily: "var(--font-geist-sans)",
    borderRadius: "0.75rem",
  },
} as const;
