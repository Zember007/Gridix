# Gridix AI Protocol (Canonical)

This file is the canonical AI guidance for this repository.

## Priority Order

1. `.cursor/skills/gridix-fsd-decomposer-skill/SKILL.md`
2. `CONTRIBUTING.md`
3. This file (`AGENTS.md`)

If instructions conflict, follow the higher-priority source.

## Monorepo Basics

- Use `pnpm` only (never `npm` or `yarn`).
- Use `pnpm --filter <package-name> <command>` for targeted runs.
- Root checks are:
  - `pnpm turbo run lint`
  - `pnpm turbo run typecheck`
  - `pnpm turbo run build`

## Architecture and Boundaries

- Keep `apps/main/src` aligned with FSD-like layers: `pages`, `features`, `entities`, `shared`.
- Treat `components/*` as legacy; prefer new/refactored logic in FSD layers.
- Keep page-level composition in `pages/*`.
- Use Supabase via boundary modules (`@/shared/api/supabase` or `@gridix/utils/api`).
- Use generated DB types from `@gridix/types/database`.

## Validation Rhythm (Cost-Aware)

- Tiny docs/comment changes: no heavy checks.
- Single-package runtime change: targeted lint + typecheck.
- Cross-package or risky change: run root lint + typecheck.
- Build and tests are required for substantial behavior changes, not every task.
- If checks are skipped, state what was skipped and why.

## Security

- Never commit `.env`, secrets, tokens, or production credentials.
- Use DEV environment conventions from `CONTRIBUTING.md`.
