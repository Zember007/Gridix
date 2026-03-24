# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands use `pnpm`. Never use `npm` or `yarn`.

```bash
# Dev servers (individual apps are preferred over running all)
pnpm dev:main          # @gridix/main on http://localhost:8080
pnpm dev:agent         # @gridix/agent-cabinet on http://localhost:8081
pnpm dev:auth          # @gridix/auth on http://localhost:5175
pnpm dev:superadmin    # @gridix/superadmin

# Targeted checks (prefer these for single-package changes)
pnpm --filter @gridix/main typecheck
pnpm --filter @gridix/main lint

# Cross-package checks (after changes affecting multiple packages)
pnpm turbo run typecheck
pnpm turbo run lint

# Build (only for substantial changes or release-critical work)
pnpm turbo run build

# Tests (apps/main uses Vitest)
pnpm --filter @gridix/main test

# DB types regeneration after a Supabase migration
pnpm supabase gen types typescript --linked > packages/types/src/database.ts
# Then strip any CLI output lines from the top/bottom of the generated file.

# Supabase migrations
pnpm supabase db push          # Push local migrations to linked project
pnpm supabase migration new <name>   # Create a new migration file
```

## Architecture

### Monorepo layout

```
apps/
  main/          @gridix/main      Primary client app (Vite + React 18)
  agent-cabinet/ @gridix/agent-cabinet
  auth/          @gridix/auth
  superadmin/    @gridix/superadmin
  partners/      @gridix/partners
packages/
  ui/            @gridix/ui        Shared Radix UI + Tailwind component library
  utils/         @gridix/utils     Supabase client, compression, i18n helpers
  types/         @gridix/types     DB types (auto-generated) + domain entity types
  config/        @gridix/config    Shared TS/ESLint configs
supabase/
  functions/     Deno edge functions (~40+)
  migrations/    SQL migration files
```

### apps/main source layers (FSD-like)

```
src/
  pages/        Page-level components — composition only, no domain logic
  features/     Orchestration of user interactions (uploads, forms, filters)
  entities/     Domain models and UI for single entities (apartment, project, …)
  shared/       Generic infrastructure (api/, hooks/, ui/, lib/, config/)
  components/   Legacy — treat as read-only unless explicitly refactoring
  contexts/     Legacy React contexts
  hooks/        Legacy root hooks
  locales/      i18n JSON files: en, ru, ar, he, ka, tr
```

Rules:

- New code goes in `pages/`, `features/`, `entities/`, or `shared/` — not into legacy zones.
- Supabase client import: always `@/shared/api/supabase` (never ad hoc from `@supabase/supabase-js`).
- DB types: always from `@gridix/types/database` (`Tables<"layout_photos">`, etc.).
- Shared UI/utils that are truly cross-app belong in `packages/`; otherwise keep them in `apps/main`.

### Supabase edge functions

- Written in Deno TypeScript; live in `supabase/functions/<name>/index.ts`.
- Shared helpers in `supabase/functions/_shared/`.
- Each function gets its own `supabase/config.toml` `[functions.<name>]` entry if JWT needs to be overridden.
- Client-facing read functions use a service-role client created from env vars, not the anon client.
- `project-editor` handles writes from the admin (upload floor plans, PDFs, apartment photos).
- `project-selector` handles all read operations for the public widget and apartment detail pages.

### Layout photos assignment model

`layout_photos` table has a tiered resolver (see `apps/main/src/entities/apartment/model/resolveLayoutPhotos.ts`):

| Tier | Condition                                                     | Priority                   |
| ---- | ------------------------------------------------------------- | -------------------------- |
| 1    | `apartment_id = apartment.id`                                 | Highest — explicit binding |
| 2    | `area_min ≤ apt.area ≤ area_max` + `layout_type` match        | Area range                 |
| 3    | No mapping, `layout_type` match, `is_project_preview = false` | Legacy fallback            |

`is_project_preview = true` with no mapping → catalog/card only, excluded from apartment gallery.
The resolver runs server-side in the edge function and also as a pure client function.

### i18n

Locale files live in `apps/main/src/locales/<lang>/<namespace>.json`.
Each namespace (e.g. `photosManager.json`) must be updated in **all 6 languages**: `en ru ar he ka tr`.
Use `t("namespace.key")` via the `useLanguage` hook.

### Absolute imports

- `@/*` → `apps/main/src/*`
- `@gridix/ui`, `@gridix/utils`, `@gridix/types` → workspace packages

## Key constraints

- **`pnpm` only** — never `npm` or `yarn`.
- **No ad-hoc Supabase imports** — always go through `@/shared/api/supabase`.
- **Locale completeness** — adding a new i18n key requires updating all 6 locale files.
- **Migration comments** — include a comment block in every migration explaining priority rules, tolerances, and backwards-compat guarantees.
- After running `supabase gen types typescript --linked`, manually strip any CLI banner lines (e.g. `Initialising login role...` or update notices) from the generated file before committing.
