---
name: gridix-fsd-decomposer
description: Plan-first FSD decomposition for Gridix monorepo (apps/* + packages/*). Default is read-only plan; apply only after explicit approval. Apply is exact-to-plan.
---

# Gridix FSD Decomposer

## Output Policy

- User-facing output is always **Russian**.
- Keep paths, code, symbols, and layer names in English.
- Be compact by default: bullets, no long intros, no repeated rules.
- Default response format is **COMPACT_PLAN**.
- Use **FULL_PLAN** only if user explicitly asks for `FULL_PLAN`.

## Core Contract

DO:

- Start in **PLAN-ONLY** (no code edits).
- Apply only after explicit user reply: **APPLY**.
- In APPLY, modify only files from approved `EXACT APPLY FILE LIST`.
- Stop and ask for re-approval if any extra file is needed.
- Keep changes strictly task-scoped (no opportunistic cleanup/refactor/formatting).

DON'T:

- change auth/RLS/billing
- import Supabase client directly
- add `widgets` layer (unless user writes `ALLOW_WIDGETS`)
- move to `packages/ui` (unless user writes `ALLOW_PACKAGES_UI_PROMOTION`)

Supabase wrapper:

- in `apps/main`: `@/shared/api/supabase`
- elsewhere: `@gridix/utils/api` if app wrapper does not exist

## FSD Rules (Compact)

- Preserve behavior and existing boundaries.
- `components/*` is legacy -> move real logic to `features/*`, `entities/*`, `shared/*`.
- Keep page composition in `pages/*`.
- Default shared UI destination: `src/shared/ui`.
- Root `hooks/*` and `contexts/*` are legacy; migrate when touched.
- Move co-located tests/styles with component.
- Do not create new tests unless explicitly requested by user.
- By default, do **not** keep compatibility wrappers in `components/*`.
- After moving logic, update all importers to new FSD paths and delete legacy files.
- Keep wrapper only if user explicitly requests `KEEP_WRAPPERS`.

Classification:

- **Feature**: intent + orchestration (+ side-effects)
- **Entity**: representation + entity rules + optional read queries
- **Shared UI**: presentation only
- **Shared Lib**: domain-agnostic helper
- **Types**: `packages/types` (cross-app), else local slice/shared types

Tie-break:

- no mutation/side-effects -> Entity
- mutation without orchestration -> ask user
- uncertain -> STOP and ask

## Imports and Hygiene

- New slice must have `index.ts` barrel.
- No reverse dependencies, no cross-entity imports.
- For move/rename: find all importers via `rg` or `explore`.
- If moved item is in `packages/*`, also check importers in other apps (`auth`, `partners`, `agent-cabinet`) and include them in exact list.
- Query keys must be namespaced; keep invalidation behavior.
- React hooks must be valid (deps, no conditional calls).
- i18n: minimal touch, add keys only for new text.

## Protocol

### Phase 1: PLAN ONLY

No code edits.

NO-OP if all true:

1. file already in proper layer (`features|entities|shared|pages`)
2. single responsibility
3. no layer mixing
4. import direction valid
5. `<=300` lines or clearly structured large file

NO-OP template:

> **Оценка: декомпозиция не требуется.**
>
> - Файл: `<path>`
> - Текущий слой: `<layer>`
> - Ответственность: `<one responsibility>`
> - Строк: `<N>`
> - Причина: `<why no decomposition>`

If file is in `components/*`, decomposition is usually required (except thin re-export wrapper explicitly approved by user via `KEEP_WRAPPERS`).

### COMPACT_PLAN format (default)

1. **Target & Scope**
2. **Decomposition Map** (classification + rationale + S/M/L; skip for pure move)
3. **File Operations + Affected Importers**
   - create / modify / move-rename / delete
   - include full **EXACT APPLY FILE LIST**
4. **Risk & Verification**
   - key risks + manual checks + lint/typecheck/build
5. **Apply Gate**
   - ask for `APPLY` or `ADJUST`

Use this exact gate text:

> "Reply APPLY to execute this plan EXACTLY for the listed files. Reply ADJUST to change the plan."

### ADJUST

- update only requested parts
- if file ops/classification changed -> re-check importers
- reprint full updated `EXACT APPLY FILE LIST`
- ask for APPLY again

### Phase 2: APPLY EXACT

- change only approved files
- if new file/importer appears -> STOP, explain delta, ask for re-approval
- if apply fails partly -> report exactly what changed and what did not
- after APPLY, always run **Depth Check** (see below)

### Phase 3: POST-APPLY DEPTH CHECK (required)

Run this check after every successful APPLY.

Ask for deeper decomposition **only if at least one condition is true**:

1. legacy file in `components/*` is not a thin wrapper (more than ~30 lines or contains business logic)
2. any newly created/updated file mixes responsibilities (state/effects + large UI composition + side-effects)
3. feature/model file is still large (`>300` lines) and can be split without behavior change
4. obvious dead code remains after migration

If any condition is true:

- output compact **DEEP_PLAN** with:
  - why deeper decomposition is needed
  - exact extra file operations
  - full `EXACT APPLY FILE LIST` for deep pass
- ask for explicit approval with this exact text:

> "Нужна дополнительная декомпозиция. Reply DEEP_APPLY to execute this deep pass EXACTLY for the listed files. Reply DONE to keep current result."

If no condition is true:

- state explicitly: `Дополнительная декомпозиция не требуется.`
- do not ask for `DEEP_APPLY`

APPLY summary (Russian):

> **Итог APPLY:**
>
> - Создано: `<N>`
> - Изменено: `<N>`
> - Перемещено/переименовано: `<N>`
> - Удалено: `<N>`
> - Что сделано: `<2-4 предложения>`
> - Следующий шаг: `<что проверить>`

## Stop Conditions

Always stop and ask if:

- cross-app changes are required but not implied
- Supabase boundary would be violated
- auth/RLS/billing would be touched
- new architecture layer is required without explicit permission
- unavoidable major behavior change is detected
- APPLY requires files outside approved list

## Definition of Done

- lint/typecheck/build pass
- behavior preserved
- no boundary violations, no circular deps, no cross-entity imports
- hooks valid, moved tests/styles updated

## Additional Reference

For rare/large scenarios (large-file subagent strategy, >10 file apply batching, detailed examples), read:

- [reference.md](reference.md)
