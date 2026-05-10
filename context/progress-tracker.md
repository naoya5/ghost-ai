# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundations — Authentication (Clerk wired)

## Current Goal

- Awaiting next feature spec.

## Completed

- Feature 03 — Auth (Clerk):
  - `@clerk/ui` installed for the `dark` base theme; `@clerk/nextjs` already present.
  - `lib/clerk-appearance.ts` — single source of truth for the Clerk `Appearance`. Uses `dark` from `@clerk/ui/themes` as the base and overrides every `variables.*` color with `var(--…)` references to the project CSS tokens (`--accent-primary`, `--bg-elevated`, `--bg-subtle`, `--text-primary`, `--text-muted`, `--border-default`, `--state-error`, `--state-success`, `--state-warning`). `fontFamily` references `--font-geist-sans`. No hardcoded hex / rgba values.
  - `app/layout.tsx` — wrapped in `ClerkProvider` with the shared `clerkAppearance` and `afterSignOutUrl={NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}` so sign-out routes straight to the public sign-in page (avoids RSC fetch failures from `proxy.ts` redirecting `/`). `EditorShell` removed from the root layout (auth pages should not render the editor chrome).
  - `app/editor/layout.tsx` + `app/editor/page.tsx` — moved the editor chrome into a dedicated `/editor` segment so only authenticated app routes mount `EditorShell`.
  - `app/page.tsx` — server component. Calls `auth()`; redirects authenticated users to `/editor`, falls back to `process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"` (the proxy already redirects unauthenticated requests via `auth.protect()`; this preserves spec parity defensively).
  - `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` — Clerk's catch-all dynamic routes wrapping `<SignIn />` / `<SignUp />` inside `AuthShell`.
  - `components/auth/auth-shell.tsx` — true 50/50 two-panel layout (`lg:w-1/2` on both halves). Left aside is near-black (`bg-base`) so the right form panel sits visibly on top of a slightly lighter `bg-surface` — the only visual differentiation between halves is the background tone, no border. Left contains: brand mark (teal `bg-brand` square + `Ghost AI` wordmark), the headline `Design systems at the speed of thought.`, a one-paragraph product description, and a 3-item feature list (`Sparkles` / `Users` / `FileText` lucide icons inside small `bg-surface` rounded-md tiles, each with title + one-line description), and a copyright footer. Below `lg`, the aside is hidden and only the form renders. No gradients, hero blocks, feature cards, or scroll-heavy sections.
  - `proxy.ts` — `clerkMiddleware` at the project root (Next.js 16 `proxy.ts`, not `middleware.ts`). Public routes are derived from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (with `/sign-in` / `/sign-up` fallbacks) using `createRouteMatcher`; everything else runs `auth.protect()`. Matcher follows Clerk's recommended pattern (skip `_next`/static, always run for `/api`, `/trpc`, and `/__clerk/*`).
  - `components/editor/editor-navbar.tsx` — Clerk `<UserButton />` mounted in the right section of the editor navbar. No customization beyond appearance inherited from the provider.
  - `next build` passes (5 routes: `/`, `/editor`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`, `_not-found`; Proxy middleware enabled).

- Feature 02 — Editor chrome:
  - `components/editor/editor-navbar.tsx` — fixed-height top navbar, three sections (left/center/right), left section hosts sidebar toggle (`PanelLeftOpen` / `PanelLeftClose` based on `isSidebarOpen`), right section reserved for future actions, `bg-surface` with subtle bottom border.
  - `components/editor/project-sidebar.tsx` — floating overlay sidebar (`fixed`, slides in from the left via `translate-x`, does not push canvas content), accepts `isOpen` + `onClose`, `Projects` header with close button, shadcn `Tabs` (`My Projects`, `Shared`) with empty placeholder content, full-width `New Project` button with `Plus` icon at the bottom.
  - `components/editor/editor-shell.tsx` — client component that owns `isSidebarOpen` state and composes `EditorNavbar` + `ProjectSidebar` around `{children}`. Originally wired into `app/layout.tsx`; in Feature 03 moved into `app/editor/layout.tsx` so auth pages do not inherit the editor chrome.
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

- Awaiting next feature spec (project dialogs / Prisma).

## Open Questions

- None.

## Architecture Decisions

- Clerk's `afterSignOutUrl` is set to a **public** route (`/sign-in`) at the `ClerkProvider` level. Reason: `proxy.ts` protects `/` via `auth.protect()`, and Next.js 16's RSC fetch on a soft sign-out navigation does not survive a middleware-driven redirect to `/sign-in` — it fails with `TypeError: Failed to fetch` and falls back to a hard browser navigation. Pointing sign-out directly at the public route keeps the sign-out path on a single, soft navigation with no middleware redirect in the middle.
- shadcn/ui generated files in `components/ui/*` are treated as protected foundation components per `ai-workflow-rules.md` — not modified after install.
- Theme tokens are defined as CSS custom properties in `app/globals.css` and exposed to Tailwind via `@theme inline`, per `ui-context.md`. shadcn's variables (`--color-background`, `--color-primary`, etc.) are aliased to project tokens so primitives blend with the project dark theme.
- Dark only: `:root` declares `color-scheme: dark` and there is no `.dark` class scope or light fallback.
- Route-protection is via `proxy.ts` at the project root (Next.js 16 renamed `middleware.ts` → `proxy.ts`). All routes are protected by default; only Clerk's sign-in/sign-up paths (resolved from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`) are public.
- Editor chrome lives under `app/editor/*`, not the root layout. The root layout is reserved for global concerns (fonts, `ClerkProvider`, base body styles) so unauthenticated routes like `/sign-in` and `/sign-up` render without the navbar / project sidebar.
- Clerk appearance is configured once in `lib/clerk-appearance.ts` and consumed by `ClerkProvider`. Color overrides are expressed as `var(--…)` references — never hex / rgba — so the Clerk widgets stay in lockstep with `globals.css` tokens.

## Session Notes

- Project shell is Next.js 16 + React 19 + Tailwind 4. Initial `globals.css` only had `@import "tailwindcss";`; this feature established the theme.
- shadcn 2.x `radix-nova` style imports primitives from the `radix-ui` meta package (not individual `@radix-ui/*` packages) and includes `tw-animate-css` for animations.
- Clerk env vars (publishable key, secret key, sign-in / sign-up URL) live in `.env.local` (gitignored, harness-restricted) and were already provisioned before Feature 03; the spec was wired against them without renaming or adding new vars.
