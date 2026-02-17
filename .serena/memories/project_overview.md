# GRIDIX-APP Overview

- Monorepo for Gridix apps and shared packages.
- Main workspaces: `apps/*` and `packages/*` (pnpm workspace + Turborepo).
- Key apps: `@gridix/main`, `@gridix/agent-cabinet`, `@gridix/auth`.
- Shared packages include `@gridix/ui`, `@gridix/utils`, `@gridix/types`, `@gridix/config`.
- Primary focus in current tasks: `apps/agent-cabinet` (Vite + React + Tailwind + TypeScript).
- Backend and platform integration: Supabase (DB/Auth/Realtime), migrations/functions managed in `supabase/`.
- CI pipeline in `.github/workflows/ci.yml` runs install + lint + typecheck + build on push/PR.
