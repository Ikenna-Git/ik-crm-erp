## Repo orientation — quick summary

- Framework: Next.js (app router). See `app/` for route entries and layout files (e.g. `app/layout.tsx`, `app/(auth)/layout.tsx`).
- Language: TypeScript + React. Path alias `@/*` maps to repo root (see `tsconfig.json`).
- Styling: Tailwind + `styles/globals.css` (imported in `app/layout.tsx`).
- UI primitives live in `components/ui/*`. Domain components grouped under `components/<domain>/` (e.g. `components/accounting/`, `components/crm/`, `components/projects/`).
- Images and static assets are in `public/`. `next.config.mjs` sets `images.unoptimized = true`.

## How to run (exact commands)
- Install deps (this repo contains `pnpm-lock.yaml`, so prefer pnpm):

  pnpm install

- Run a dev server:

  pnpm dev

- Production build / start:

  pnpm build
  pnpm start

- Lint:

  pnpm lint

If you must use npm: replace `pnpm` with `npm run` (e.g. `npm run dev`).

## Key project-specific conventions for agents

- App router & route groups: This repo uses Next.js app directory and route groups (directories wrapped in parentheses) to organize layouts and route segmentation. Example: `app/(auth)/login/page.tsx` and `app/(dashboard)/dashboard/page.tsx`. When adding a route, follow the same file naming: `page.tsx` for pages and `layout.tsx` for nested layout wrappers.

- Server vs Client components: The default is React Server Components. Files that must run on the client explicitly include `'use client'` at the top (see `components/theme-provider.tsx`). Before editing, check for `use client` declaration; adding browser-only hooks (useState/useEffect) requires converting the file to a client component.

- UI primitives: Small building blocks live in `components/ui/` and are intended to be reused. Prefer composing these rather than duplicating Tailwind markup. Examples: `components/ui/button.tsx`, `components/ui/input.tsx`.

- Domain components: Feature-area components live in `components/<domain>/` (e.g., `components/accounting/expenses-table.tsx`). Keep domain-level layout/logic under `app/(dashboard)` or respective route groups.

- Path aliases: Use `@/` imports for root-relative paths (configured in `tsconfig.json`). Example: `import { ThemeProvider } from '@/components/theme-provider'`.

- TypeScript build note: `next.config.mjs` sets `typescript.ignoreBuildErrors = true`. This means the production build may succeed despite TypeScript errors. Be conservative: do not introduce obvious type regressions, and prefer local type fixes where straightforward.

## Patterns and examples an AI agent should follow

- Prefer layout composition via `layout.tsx` files in `app/` route groups. See `app/layout.tsx` for the global wrapper and `app/(auth)/layout.tsx` for auth-specific layout.
- When modifying a UI primitive under `components/ui`, check for other components referencing it. Use existing prop shapes and `className` merging conventions (Tailwind classes, sometimes `clsx` or `cva`).
- Respect client boundary: if you add hooks or event handlers to a server component, either move logic to a client component or mark the file with `'use client'` and confirm no server-only APIs are used.

## External integrations & dependencies

- Many Radix UI packages are used for primitives (`@radix-ui/*`), plus `next-themes` for theming and `@vercel/analytics` for telemetry (imported in `app/layout.tsx`).
- Images are kept in `public/`. `next.config.mjs` uses `unoptimized: true`, so image optimization is intentionally disabled — do not assume Next's default optimization is active.

## Common developer workflows and gotchas

- Preferred package manager: pnpm (presence of `pnpm-lock.yaml`). Use `pnpm install` to reproduce the lockfile.
- Linting: run `pnpm lint` (script maps to `eslint .`). No test runner is present in `package.json`.
- Type checking: the build ignores type errors by config — for correctness, run `tsc --noEmit` locally when you need strict checking.

## What to look for when editing or adding code

- Check whether the target file is a client or server component (`'use client'` marker). Convert carefully.
- Reuse UI primitives from `components/ui/` when possible.
- When adding new routes, mirror existing nested layout structure using route groups (parent `layout.tsx` + nested `page.tsx`).
- Follow the existing naming and export patterns for components (most are default or named function exports; keep consistent with nearby files).

## Files to inspect for context (examples)

- `app/layout.tsx` — global layout and font imports
- `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx` — auth route grouping example
- `components/theme-provider.tsx` — client-only theme wrapper
- `components/ui/*` — UI primitives to reuse
- `components/accounting/expenses-table.tsx` — example domain component
- `next.config.mjs`, `tsconfig.json`, `package.json` — build, type and path config

## Quick instructions for PRs or refactors

- Keep changes small and local to one domain where possible.
- If you change a `components/ui/*` primitive, run a quick repo search to update usages.
- Avoid disabling `typescript.ignoreBuildErrors` in `next.config.mjs` without a follow-up that fixes type issues.

---

If anything here is unclear or you want more detailed snippets (e.g., how to convert a server component to a client component in this repo), tell me which area to expand and I'll iterate.
