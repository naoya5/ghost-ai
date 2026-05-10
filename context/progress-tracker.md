# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundations — Editor chrome (navbar + project sidebar shell)

## Current Goal

- Land Feature 02 — Editor chrome: top navbar with sidebar toggle and a floating project sidebar shell with `My Projects` / `Shared` tabs and a `New Project` action.

## Completed

- Feature 02 — Editor chrome:
  - `components/editor/editor-navbar.tsx` — fixed-height top navbar, three sections (left/center/right), left section hosts sidebar toggle (`PanelLeftOpen` / `PanelLeftClose` based on `isSidebarOpen`), right section reserved for future actions, `bg-surface` with subtle bottom border.
  - `components/editor/project-sidebar.tsx` — floating overlay sidebar (`fixed`, slides in from the left via `translate-x`, does not push canvas content), accepts `isOpen` + `onClose`, `Projects` header with close button, shadcn `Tabs` (`My Projects`, `Shared`) with empty placeholder content, full-width `New Project` button with `Plus` icon at the bottom.
  - `components/editor/editor-shell.tsx` — client component that owns `isSidebarOpen` state and composes `EditorNavbar` + `ProjectSidebar` around `{children}`. Wired into `app/layout.tsx` so every editor route inherits the chrome.
  - Dialog pattern: relies on the protected shadcn `Dialog` primitive in `components/ui/dialog.tsx` — already styled via the `globals.css` tokens (`bg-popover`, `text-popover-foreground`) and supports title (`DialogTitle`), description (`DialogDescription`), and footer actions (`DialogFooter`). No new dialogs built yet — primitive ready for future use.
  - `next build` and `tsc --noEmit` pass.

- Feature 01 — Design system:
  - `shadcn/ui` initialized (`components.json`, `radix-nova` style, neutral base, CSS variables on).
  - Primitives added: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea (under `components/ui/*`, treated as protected foundation).
  - `lucide-react` installed (icon library).
  - `lib/utils.ts` exports `cn()` built on `clsx` + `tailwind-merge`.
  - `app/globals.css` defines the project dark-only theme tokens from `ui-context.md` and maps them to Tailwind utilities (`bg-base`, `text-copy-primary`, `border-surface-border`, `text-brand`, etc.) plus shadcn variables (`--color-background`, `--color-primary`, …) so generated components inherit the dark theme.
  - `app/layout.tsx` loads Geist Sans and Geist Mono via `next/font/google` and exposes them as `--font-geist-sans` / `--font-geist-mono` per `ui-context.md`.
  - `next build` and `tsc --noEmit` pass.

## In Progress

- None.

## Next Up

- Awaiting next feature spec (editor canvas / dialogs).

## Open Questions

- None.

## Architecture Decisions

- shadcn/ui generated files in `components/ui/*` are treated as protected foundation components per `ai-workflow-rules.md` — not modified after install.
- Theme tokens are defined as CSS custom properties in `app/globals.css` and exposed to Tailwind via `@theme inline`, per `ui-context.md`. shadcn's variables (`--color-background`, `--color-primary`, etc.) are aliased to project tokens so primitives blend with the project dark theme.
- Dark only: `:root` declares `color-scheme: dark` and there is no `.dark` class scope or light fallback.

## Session Notes

- Project shell is Next.js 16 + React 19 + Tailwind 4. Initial `globals.css` only had `@import "tailwindcss";`; this feature established the theme.
- shadcn 2.x `radix-nova` style imports primitives from the `radix-ui` meta package (not individual `@radix-ui/*` packages) and includes `tw-animate-css` for animations.
