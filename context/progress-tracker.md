# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Foundations — Editor home is now backed by the real project API end-to-end. Sidebar hydrates from server-rendered Prisma data; create/rename/delete dialogs call `/api/projects[/[projectId]]`. Project ID is the slug-with-suffix room ID generated on the client.

## Current Goal

- Awaiting next feature spec. Likely the `/editor/[projectId]` workspace route (the create flow now redirects there) or Liveblocks room token issuance.

## Completed

- Feature 07 — Wire editor home to project API:
  - `lib/projects.ts` — server-only data helper. `getProjectsForUser(userId, userEmail)` runs two `prisma.project.findMany` queries in parallel: owned (`where: { ownerId: userId }`) and shared (`where: { ownerId: { not: userId }, collaborators: { some: { email } } }`). Both are ordered by `createdAt desc` and projected via `select: { id, name }`. Returns `{ owned, shared }` as UI-shaped `Project[]` (`slug` is set to `id` — see decision below). When `userEmail` is `null` the shared query is skipped (resolves to `[]`).
  - `app/editor/layout.tsx` — converted to an async server component. Calls `await auth()` for the Clerk userId and `currentUser()` for the user's primary email, then passes the lists into `EditorShell` props. Defensive empty-lists fallback if `userId` is missing (proxy middleware should redirect first, but the layout still type-checks without it).
  - `app/editor/page.tsx` — now a pure server component. Renders the empty-state heading + description and delegates the CTA to a small client component (`NewProjectButton`) so the page tree stays server-rendered.
  - `components/editor/new-project-button.tsx` — single-purpose client island that reads `useProjects().openCreate`. Keeps the "use client" boundary as small as possible.
  - `components/editor/editor-shell.tsx` — accepts `ownedProjects` / `sharedProjects` and forwards them into `ProjectsProvider`. No internal data state.
  - `components/editor/projects-provider.tsx` — replaced the in-memory list. Now accepts both lists via props and uses `useProjectActions` (instead of the old `useProjectDialogs`). Context value exposes the same `ownedProjects / sharedProjects / openCreate / openRename / openDelete` shape so the sidebar didn't change.
  - `components/editor/dialogs/create-project-dialog.tsx` — accepts a `roomId` prop and renders it as the "Room ID preview" (was just the slug). Submit is gated on `roomId.length > 0`.
  - `hooks/use-project-actions.ts` — new hook owning dialog state, the `name` form value, the per-create suffix, and the three mutations:
    - **Create** generates a 6-char `[a-z0-9]` suffix via `crypto.getRandomValues` when the dialog opens, derives `roomId = ${toSlug(name)}-${suffix}` on every keystroke, then `POST /api/projects` with `{ id: roomId, name }`. On `2xx`, resets state and `router.push(/editor/${id})` — keeps the project ID and the future Liveblocks room ID aligned.
    - **Rename** stores `{ project, name }` from `openRename(project)`, prefills the input with the current name, `PATCH /api/projects/[id]` with `{ name }`, and `router.refresh()` so the server-rendered sidebar lists re-fetch.
    - **Delete** stores the target project from `openDelete(project)`, `DELETE /api/projects/[id]`, then compares `pathname` against `/editor/${id}` (and its sub-routes) — if the user was viewing the deleted workspace, `router.push("/editor")`; otherwise `router.refresh()`.
    - All three submit paths guard against re-entrancy (`isSubmitting` flag) and call `reset()` before navigating/refreshing.
  - `lib/api/project-payload.ts` — added `parseProjectId(body)` (matches `^[a-z0-9]+(-[a-z0-9]+)*$`, max 128 chars). Used by `POST /api/projects` so clients that send a slug-with-suffix id get it stored verbatim; missing/invalid id falls back to Prisma's `cuid()` default.
  - `app/api/projects/route.ts` — `POST` now spreads `...(id ? { id } : {})` into the Prisma `create` data so client-provided ids are persisted. Unchanged for `GET` and for `PATCH/DELETE`.
  - Removed `lib/mock-projects.ts` and `hooks/use-project-dialogs.ts` — both fully superseded by the new helper + hook.
  - `next build` passes. `/editor` is now `ƒ` (dynamic) instead of `○` because the layout uses `auth()` / `currentUser()`. Routes still total 7.

- Feature 06 — Project API routes:
  - `lib/api/project-payload.ts` — shared boundary parsers. `parseProjectName(body)` returns the trimmed string only when `body.name` is a non-empty string; `parseProjectDescription(body)` is the same shape for `description` (used only by `POST` since the spec scopes rename to `name`). `readJsonBody(request)` wraps `request.json()` and returns `null` on parse failure so handlers don't have to try/catch JSON parsing inline.
  - `app/api/projects/route.ts`:
    - `GET` — calls `await auth()`, returns `401 { error: "Unauthorized" }` when `userId` is missing, otherwise returns `Response.json({ projects })` where `projects = prisma.project.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } })`.
    - `POST` — auth check identical to `GET`. Parses the JSON body via `readJsonBody`. Falls back to `"Untitled Project"` when `parseProjectName` returns `undefined`. Persists with `prisma.project.create({ data: { ownerId: userId, name, ...(description ? { description } : {}) } })` (spread keeps `description: undefined` out of the data payload so Prisma stores `NULL`). Returns `Response.json({ project }, { status: 201 })`.
  - `app/api/projects/[projectId]/route.ts`:
    - Shared `RouteContext { params: Promise<{ projectId: string }> }` matches the Next.js 16 async-params signature (`await ctx.params`).
    - `PATCH` — `await auth()` → `401` on missing `userId`; `prisma.project.findUnique({ where: { id }, select: { ownerId: true } })` → `404 { error: "Not Found" }` if the row is gone; ownership compared via `existing.ownerId !== userId` → `403 { error: "Forbidden" }`. Then `parseProjectName(body)` is required (`400 { error: "name is required" }` if missing) before `prisma.project.update({ where: { id }, data: { name } })`. Returns `Response.json({ project })`.
    - `DELETE` — same auth/404/403 sequence as `PATCH`, then `prisma.project.delete({ where: { id } })`, returns `204` with an empty body.
  - `proxy.ts` — added `isApiRoute = createRouteMatcher(["/api/(.*)"])` and an early `return` for both public and API routes. Reason: `auth.protect()` in middleware redirects unauthenticated browser requests to the sign-in page (or `notFound()` for non-document requests), which conflicts with the spec's requirement that `/api/*` return JSON `401` to API clients. Page routes (`/`, `/editor`) still run `auth.protect()`.
  - `lib/prisma.ts` — changed `createPrismaClient(): PrismaClient` return type (was `ReturnType<typeof createPrismaClient>`, a union of the bare and `$extends(withAccelerate())` clients). The Accelerate branch now `as unknown as PrismaClient`-casts back to the base type. Reason: the union type was uncallable at usage sites — `prisma.project.findUnique` failed type-checking with "Each member of the union type has signatures, but none of those signatures are compatible". Collapsing to `PrismaClient` lets call sites use the normal Prisma surface while keeping the Accelerate connection path. The Accelerate-only extension methods (`cacheStrategy`, etc.) are hidden from the type — re-introduce a typed wrapper if/when we need them.
  - `next build` passes: routes now total 7 (`/`, `/_not-found`, `/api/projects`, `/api/projects/[projectId]`, `/editor`, `/sign-in/[[...sign-in]]`, `/sign-up/[[...sign-up]]`). Both API routes are dynamic.

- Feature 05 — Prisma schema and data layer:
  - `prisma/models/project.prisma` — adds the `ProjectStatus` enum (`DRAFT`, `ARCHIVED`) and two models:
    - `Project`: `id` (cuid PK), `ownerId` (Clerk user id), `name`, optional `description`, `status` (default `DRAFT`), optional `canvasJsonPath` for future Vercel Blob references, `createdAt` / `updatedAt`, plus indexes on `ownerId` and `createdAt`. Has a `collaborators ProjectCollaborator[]` back-relation.
    - `ProjectCollaborator`: composite primary key `@@id([projectId, email])` (covers spec's unique constraint requirement without adding a synthetic `id`), `createdAt`, `project Project @relation(... onDelete: Cascade)`, and indexes on `email` and `[projectId, createdAt]`.
  - `lib/prisma.ts` — cached `PrismaClient` singleton with `globalForPrisma` cache in non-production so Next.js hot reloads don't leak connections. Branches by `DATABASE_URL` prefix:
    - `prisma+postgres://` → `new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) }).$extends(withAccelerate())` (Prisma Postgres / Accelerate-style caching).
    - otherwise → `new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })` (direct TCP Postgres).
    - Throws if `DATABASE_URL` is not set at construction time. Imports `PrismaClient` from `@/app/generated/prisma/client` (path from the existing `generator client` block in `prisma/schema.prisma`).
  - `npm install @prisma/extension-accelerate` — added the Accelerate client extension. `@prisma/adapter-pg`, `@prisma/client`, `pg`, and `prisma` were already installed.
  - `npx prisma migrate dev --name init` — connected to the Prisma Postgres database (`db.prisma.io:5432`, schema `public`) and produced `prisma/migrations/20260512063803_init/migration.sql`. SQL creates the `ProjectStatus` enum, both tables, all four indexes, and the `ON DELETE CASCADE` foreign key. The migration is applied to the dev database and is in sync.
  - `npx prisma generate` regenerates the typed client into `app/generated/prisma/` (already covered by `.gitignore`).
  - `next build` passes; routes unchanged (5).

- Feature 04 — Project Dialogs & Editor Home:
  - `types/project.ts` — `Project` interface (`id`, `name`, `slug`, `ownership: "owner" | "collaborator"`).
  - `lib/slug.ts` — `toSlug()` helper. Lowercases, trims, collapses non-alphanumeric runs into `-`, strips leading/trailing dashes.
  - `lib/mock-projects.ts` — `MOCK_PROJECTS` seed: 2 owned (`Realtime Chat Backend`, `Image Pipeline`) + 1 collaborator (`Team Knowledge Base`).
  - `hooks/use-project-dialogs.ts` — `useProjectDialogs({ onCreate, onRename, onDelete })`. Owns dialog state (`openDialog: "create" | "rename" | "delete" | null`), the active project, the shared `name` form value, and `isSubmitting`. Exposes `openCreate / openRename / openDelete / close` plus `submitCreate / submitRename / submitDelete` which trim, guard against empty/duplicate input, and reset state on success. The mutation callbacks are stored in an `optionsRef` synced via `useEffect` so the submit callbacks stay memoized across parent re-renders (caller can pass an inline `{ onCreate, onRename, onDelete }` literal without busting `useCallback`).
  - `components/editor/dialogs/create-project-dialog.tsx` — controlled name input with autoFocus + Enter-to-submit, live `toSlug(name)` preview rendered in a mono-font surface, footer Cancel + `Create project` (disabled until slug is non-empty).
  - `components/editor/dialogs/rename-project-dialog.tsx` — prefilled name input (autoFocus + Enter-to-submit), description shows the current project name, submit disabled when empty or unchanged.
  - `components/editor/dialogs/delete-project-dialog.tsx` — destructive confirmation only (no input). Footer uses `variant="destructive"` for the Delete button.
  - `components/editor/projects-provider.tsx` — `ProjectsProvider` + `useProjects()` context. Owns the in-memory project list (mock only), wires the hook callbacks to mutate the list (prepend on create, map on rename, filter on delete), exposes `ownedProjects` / `sharedProjects` / `openCreate` / `openRename` / `openDelete`, and renders all three dialogs at the root so they portal correctly regardless of where they were triggered. New project ids use `crypto.randomUUID()` to avoid collisions on rapid creation. `handleRename` no-ops when both `name` and `slug` are unchanged (defense-in-depth alongside the dialog-level guard).
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

- Awaiting next feature spec — most likely the `/editor/[projectId]` workspace route (the create flow now redirects there but the page doesn't exist yet).

## Open Questions

- None.

## Architecture Decisions

- Project ID == Liveblocks room ID. The client generates `${toSlug(name)}-${suffix}` (6-char `[a-z0-9]` suffix via `crypto.getRandomValues`) before calling `POST /api/projects`. Reason: the spec for Feature 07 explicitly requires "project ID and Liveblocks room ID should stay aligned" — generating the id client-side and letting the API store it verbatim means the same value can be reused as the Liveblocks room id later without a second lookup. `parseProjectId` validates the format server-side; if the client omits the id, Prisma's `cuid()` default still applies (defense-in-depth for non-UI callers).
- Editor data is fetched in `app/editor/layout.tsx`, not the page. Reason: the sidebar lives inside `EditorShell` (rendered by the layout) and needs both lists; pages cannot push data up to the layout in Next.js. Fetching in the layout means every editor route gets the lists for free, while the page itself stays a small server component that delegates the only client interaction (`openCreate`) to `NewProjectButton`.
- `lib/projects.ts` is marked `import "server-only"` and queries Prisma directly rather than calling `GET /api/projects`. Reason: the API route requires Clerk's session and would force the server component into a fetch-against-self pattern with auth replay; using Prisma directly inside the already-authenticated layout is both simpler and faster.
- `useProjectActions` consolidates dialog state, the create-suffix, and the API mutation calls in one hook. Reason: the previous split (`useProjectDialogs` + provider-owned mutation callbacks) made sense when mutations only touched in-memory mocks. Once mutations need `router.push` / `router.refresh` and the create flow needs a stable suffix tied to the dialog lifecycle, owning all of that in a single hook avoids ferrying `router` instances through the dialog component or recreating suffixes on every render.
- Delete navigation uses `pathname` (from `usePathname`) to detect whether the deleted project is the currently-open workspace. Reason: the spec requires "redirect to `/editor` if deleting the active workspace, otherwise refresh"; pathname matching against `/editor/${id}` and its sub-routes is the lightest way to distinguish the two cases without threading the active project id through React context.
- API routes (`/api/*`) are excluded from `auth.protect()` in `proxy.ts` and instead enforce authentication inline (`await auth()` → explicit `401` JSON response). Reason: middleware's `auth.protect()` redirects unauthenticated browser requests to `/sign-in` and uses `notFound()` for non-document requests, neither of which matches the spec contract that API clients receive `401 { error: "Unauthorized" }`. Page routes still use middleware protection.
- API ownership checks happen inside each handler: `prisma.project.findUnique({ select: { ownerId: true } })` is run first, returning `404` if the row is gone and `403` if `ownerId !== userId`. This pattern is shared across `PATCH` and `DELETE` so the spec's distinction between "not found" and "non-owner mutation" stays clear (rather than collapsing both into `404`).
- Project create defaults `name` to `"Untitled Project"` when the request omits it or sends an empty string. Reason: spec rule "default missing project name to `Untitled Project`". The fallback is applied **after** `parseProjectName` trims input, so whitespace-only names also trigger the default rather than persisting blank values.
- `lib/prisma.ts` types the export as `PrismaClient` (not a union of base + Accelerate-extended client). Reason: Prisma's `$extends` widens the generic type signature so the union of "bare client" and "extended client" is not assignable to a single callable shape — `prisma.project.findUnique(...)` fails type-checking. Casting the Accelerate branch back to `PrismaClient` keeps the runtime extension active for the Accelerate URL while exposing the standard Prisma surface to consumers. If Accelerate-specific methods (`cacheStrategy`, etc.) are needed later, introduce a separate typed export instead of widening the base.
- Prisma 7 client is always constructed with a driver adapter (`@prisma/adapter-pg`'s `PrismaPg`) — Prisma 7 throws when `new PrismaClient()` is called without arguments, so the adapter is required even in the Accelerate branch. The Accelerate branch additionally chains `.$extends(withAccelerate())` from `@prisma/extension-accelerate` to opt the client into Accelerate's caching/extension surface. Type is then cast back to `PrismaClient` (see preceding decision).
- `ProjectCollaborator` uses a composite primary key (`@@id([projectId, email])`) instead of a synthetic `id` column. Reason: spec required a unique constraint on `(projectId, email)` plus "no extra fields unless required by Prisma" — composite PK satisfies both the uniqueness constraint and Prisma's primary-key requirement without adding a column.
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
