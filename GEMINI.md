# Gridix AI Protocol (Canonical)

This file is the canonical AI guidance for this repository.

## Priority Order

1. This file (`AGENTS.md`)
2. Explicitly invoked task skill (for example: FSD decomposition, routing, UI standards, plan-first-apply)
3. On-demand docs only when needed (`README.md`, `CONTRIBUTING.md`, references)

If instructions conflict, follow the higher-priority source.

## Monorepo Basics

- Use `pnpm` only.
- Prefer targeted commands first: `pnpm --filter <package-name> <command>`.
- Use root checks only for cross-package or higher-risk changes:
  - `pnpm turbo run lint`
  - `pnpm turbo run typecheck`
  - `pnpm turbo run build`

## Default Working Mode

- Keep responses compact.
- Stay task-scoped; avoid opportunistic refactors.
- For code changes, prefer plan-first behavior unless the user clearly asks to apply immediately.
- If scope expands or an extra file becomes necessary, stop and surface the delta.

## Architecture and Boundaries

- In `apps/main/src`, keep new or refactored code aligned with FSD-like layers: `pages`, `features`, `entities`, `shared`.
- Treat `components/*`, root `hooks/*`, and root `contexts/*` as legacy zones.
- Keep page composition in `pages/*`.
- Prefer shared reuse via `packages/ui`, `packages/utils`, and `packages/types` when the code is truly cross-app.
- Do not move code to `packages/ui` unless it is explicitly cross-app or requested.

## Supabase Boundary

- Do not import Supabase client ad hoc.
- In `apps/main`, use `@/shared/api/supabase`.
- Elsewhere, use the approved shared boundary module.
- Use generated DB types from `@gridix/types/database`.
- Do not guess schema or migration details; consult dedicated docs or tooling only when needed.

## Validation Rhythm

- Docs / prompts / rules only: heavy checks may be skipped.
- Single-package runtime change: run targeted `lint` + `typecheck` for the affected package.
- Cross-package or risky change: run root `lint` + `typecheck`.
- Run `build` only for substantial behavior changes, release-critical work, or when risk is unclear.
- If checks are skipped, state what was skipped and why.

## Security

- Never commit `.env`, secrets, tokens, or production credentials.
- Do not expose or rewrite real secrets in examples.

## Context Efficiency

- Do not use `README.md`, `CONTRIBUTING.md`, or large reference docs as default context.
- Pull heavy docs only when the task specifically needs them.
- Use the FSD decomposer only for decomposition / migration / move-rename tasks, not for ordinary bugfixes or small UI changes.
