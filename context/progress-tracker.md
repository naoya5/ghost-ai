# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundations — Project Dialogs & Editor Home (mock data only)

## Current Goal

- Awaiting next feature spec (likely Prisma + project persistence).

## Completed

- Feature 04 — Project Dialogs & Editor Home:
  - `types/project.ts` — `Project` interface (`id`, `name`, `slug`, `ownership: "owner" | "collaborator"`).
  - `lib/slug.ts` — `toSlug()` helper. Lowercases, trims, collapses non-alphanumeric runs into `-`, strips leading/trailing dashes.
  - `lib/mock-projects.ts` — `MOCK_PROJECTS` seed: 2 owned (`Realtime Chat Backend`, `Image Pipeline`) + 1 collaborator (`Team Knowledge Base`).
  - `hooks/use-project-dialogs.ts` — `useProjectDialogs({ onCreate, onRename, onDelete })`. Owns dialog state (`openDialog: "create" | "rename" | "delete" | null`), the active project, the shared `name` form value, and `isSubmitting`. Exposes `openCreate / openRename / openDelete / close` plus `submitCreate / submitRename / submitDelete` which trim, guard against empty/duplicate input, and reset state on success.
  - `components/editor/dialogs/create-project-dialog.tsx` — controlled name input with autoFocus + Enter-to-submit, live `toSlug(name)` preview rendered in a mono-font surface, footer Cancel + `Create project` (disabled until slug is non-empty).
  - `components/editor/dialogs/rename-project-dialog.tsx` — prefilled name input (autoFocus + Enter-to-submit), description shows the current project name, submit disabled when empty or unchanged.
  - `components/editor/dialogs/delete-project-dialog.tsx` — destructive confirmation only (no input). Footer uses `variant="destructive"` for the Delete button.
  - `components/editor/projects-provider.tsx` — `ProjectsProvider` + `useProjects()` context. Owns the in-memory project list (mock only), wires the hook callbacks to mutate the list (prepend on create, map on rename, filter on delete), exposes `ownedProjects` / `sharedProjects` / `openCreate` / `openRename` / `openDelete`, and renders all three dialogs at the root so they portal correctly regardless of where they were triggered.
  - `components/editor/editor-shell.tsx` — wraps `EditorNavbar`, `ProjectSidebar`, and `{children}` in `ProjectsProvider` so the sidebar and the `/editor` home page share the same dialog state.
  - `components/editor/project-sidebar.tsx` — replaces the empty placeholder content with `ProjectList` (renders `ProjectRow` per project, hover-revealed actions only for owned projects). Project rows show name + mono slug. Action buttons (`Pencil` rename, `Trash2` delete) are rendered only when `onRename`/`onDelete` are passed — the Shared tab omits them. Bottom `New Project` button now calls `openCreate`. Added a mobile-only backdrop scrim (`md:hidden`, `bg-black/50`, fades in with the sidebar) that closes the sidebar on tap.
  - `app/editor/page.tsx` — converted to a client component. Renders the empty-state heading `Create a project or open an existing one`, description, and a `New Project` button (with `Plus` icon) that calls `openCreate`. No card wrapper.
  - Slug edge cases verified across 28 inputs (empty / whitespace-only / tabs / CR-LF / full-width space `　` / punctuation-only / emoji / Japanese / mixed Japanese+ASCII / URL-like / surrounding dashes / double dashes / numbers / dots & underscores). Output is always either `""` or a clean `^[a-z0-9]+(-[a-z0-9]+)*$` shape. The rename dialog and the provider's `handleCreate` / `handleRename` both reject names that produce an empty slug (e.g. `"日本語"` alone, `"!!!"`, `"🚀"`) so the UI cannot persist an unrouteable project.
  - `tsc --noEmit`, `npm run lint`, and `next build` all pass (5 routes unchanged).

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

- Persistence layer (Prisma) for projects so dialog actions stop being mock-only.

## Open Questions

- None.

## Architecture Decisions

- Project list, dialog state, and dialog rendering all live in a single `ProjectsProvider` mounted inside `EditorShell`. Reason: both the `/editor` empty-state page (rendered as `{children}`) and the floating sidebar need to trigger the same dialogs over the same in-memory list. Lifting state up to the provider keeps the dialog instances mounted once and prevents stale state when the sidebar opens/closes. Dialogs are rendered as siblings of `{children}` so Radix portals from the same root regardless of trigger origin.
- The dialog hook (`useProjectDialogs`) takes mutation callbacks (`onCreate / onRename / onDelete`) instead of owning the project list. Reason: the hook is a presentation-state primitive (open/close, form value, submitting flag) that can later be wired to a real API or Prisma mutation by swapping the callbacks — no churn inside the dialog components.
- Sidebar item actions (rename/delete) are gated by passing `onRename`/`onDelete` props per row. The Shared tab calls `<ProjectList>` without them, so collaborator projects never render the affordances. Reason: spec requires hiding actions for shared projects; gating by prop presence keeps `ProjectRow` reusable without an extra `ownership` branch.
- Mobile sidebar dismissal uses a tap-to-close backdrop scrim (`md:hidden`, `bg-black/50`) rendered as a sibling of the `<aside>`, fading in/out with the same transition. Reason: the floating sidebar overlays content rather than pushing it, so there is no off-canvas region to detect outside-taps against.
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
