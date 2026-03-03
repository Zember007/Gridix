---
name: gridix-fsd-decomposer
description: Plan-first FSD decomposition for Gridix monorepo (apps/* + packages/*). Default is read-only plan; apply only after explicit approval. Apply is exact-to-plan.
---

# Gridix FSD Decomposer Skill (Plan → Confirm → Apply EXACT)

You refactor large React + TypeScript components into correct FSD structure
while respecting Gridix boundaries, CI gates, and team workflow.

## CRITICAL BEHAVIOR

- Default: **PLAN-ONLY** (read-only, no code changes).
- Changes happen **ONLY** after explicit user confirmation: the user must reply with **APPLY** (or “apply the plan”).
- **APPLY is EXACT-TO-PLAN**: when applying, you may only modify files explicitly listed in the approved plan. If any additional file needs changes, you must STOP and request a new approval.

This skill is intended for team-wide use.

---

# 🔒 HARD RULES (NON-NEGOTIABLE)

- Preserve runtime behavior.
- No auth / RLS / billing changes.
- No direct Supabase client import — must use wrapper:
  - `@/shared/api/supabase`
  - or `@gridix/utils/api`
- Respect existing ESLint boundaries (app-layer isolation, entity restrictions, etc.).
- Page-level composition must stay inside `pages/*`.
- Do NOT introduce new architectural layers (e.g., widgets) unless explicitly requested.
- `components/*` is legacy: new/refactored logic should move into `features/*`, `entities/*`, or `shared/*`.
  - A thin wrapper in `components/*` is allowed only as a transitional re-export/adapter.

---

# 🧠 GRIDIX ARCHITECTURE MODEL

Gridix is **FSD-like hybrid** (especially in apps/main/src):

- app
- pages
- features
- entities
- shared
- legacy components (migration target)

Other apps may be less FSD; apply the same classification, but keep changes scoped to the requested target area.

---

# 🧩 LAYER CLASSIFICATION ENGINE (MANDATORY)

Classify extracted pieces using this checklist (top-down):

## 1) Feature

Feature = **intent + orchestration + (usually) side-effects**

- Intent (required): meaningful user use-case
  - save / publish / upload / assign / export / approve / submit / confirm / invite / sync
- Orchestration: coordinates multiple steps (validation + mutation + feedback, etc.)
- Side-effects (common, not mandatory): mutate, toast, navigate, invalidate, storage upload, analytics

**Anti-rule:** fetch ≠ feature. Use-case defines feature.

Destination: `features/<feature-name>/(ui|model|hooks|api|lib|context)/...`

Examples:

- UploadPdf (file input → storage upload → update record → toast) → features/upload-pdf
- ProjectSaveButton (validate → mutate → invalidate → toast) → features/save-project

## 2) Entity

Entity = **representation + entity rules + optional read access**

- May include read queries
- No use-case orchestration

Destination: `entities/<entity-name>/(ui|model|queries|api|lib)/...`

Examples:

- ProjectCard + useProjectByIdQuery (read) → entities/project
- ApartmentRow (format price/area/status) → entities/apartment/ui

## 3) Shared UI

Shared UI = **presentation + UI state only**

- no domain rules
- no orchestration

Destination: `shared/ui/...` (NOT packages/ui unless explicitly requested)

Example:

- TableSection (table + toolbar without domain decisions) → shared/ui

---

# 📦 DESTINATION RULES

- If starting from `components/*`:
  - move the real implementation to `features/*` / `entities/*` / `shared/*`
  - keep only a thin wrapper/re-export in `components/*` if needed for compatibility

- Page-level composition:
  - stays in `pages/*` (compose features/entities/shared)

- Reusable UI:
  - goes to `src/shared/ui` by default
  - do NOT move to `packages/ui` unless user explicitly requests cross-app promotion

---

# 📁 INTERNAL STRUCTURE STANDARD

When decomposition warrants it, use:
<slice>/
api/
model/
hooks/
context/
ui/
lib/
index.ts

---

# 🧭 IMPORT POLICY

- Deep imports should be corrected by introducing/using `index.ts` barrels and updating imports.
- Creating `index.ts` is allowed and preferred for extracted slices.
- Keep import directions sane (avoid reverse dependencies).

---

# 🎯 NAMING RULES

- Components: PascalCase.tsx
- Utils: kebab-case.ts
- Hooks: camelCase (useXxx.ts)
- Props typing:
  - If >3 props or complex → create `type Props = { ... }`
  - Otherwise inline is acceptable

---

# ⚛️ REACT RULES (MUST FOR MODIFIED CODE)

If you touch a component/hook:

- No conditional hooks
- Fix dependency arrays
- Remove useless useEffect
- Add useMemo/useCallback only where it improves correctness/perf (avoid cargo-cult)

---

# 📡 TANSTACK QUERY RULES

If you create/modify queries:

- Stabilize query keys (namespaced, non-generic)
  - Example: `["projects", projectId, "editor"]`
- Avoid keys like `["data"]`, `["list"]` without namespace
- If mutation: keep invalidation behavior intact
- Only check key hygiene within the changed scope (no repo-wide audit)

---

# 🌍 i18n RULES

- Prefer minimal touch.
- Add new keys only if new UI text appears.
- Do not mass-delete “dead keys” (separate task).

---

# ✅ TWO-PHASE PROTOCOL (MANDATORY)

## PHASE 1 — PLAN ONLY (DEFAULT)

You MUST NOT change code in this phase.

Output exactly:

1. **Target & Scope**

- What file/folder was requested
- What you inspected (key related files)

2. **Decomposition Map**

- List extracted parts and their classification: Feature / Entity / Shared UI
- Short rationale per part

3. **Proposed File Operations**

- New files to create (full paths)
- Files to move/rename (from → to)
- New/updated `index.ts` barrels
- Imports to update (high-level)

4. **EXACT APPLY FILE LIST (REQUIRED)**

- A definitive list of files that will be modified/created/moved during APPLY.
- This list is the **only** allowed scope in APPLY.
- Group by:
  - Modify
  - Create
  - Move/Rename
  - Delete (optional; only if safe and requested)

5. **Risk Assessment**

- Potential regressions (hooks deps, query keys, i18n, styles)
- Any boundary risks (supabase wrapper, layer violations)

6. **Verification Steps**

- Manual steps (what screens/actions to click)
- CI gates expected: lint / typecheck / build

7. **Commit Plan**

- 3–8 commits (not too granular), each message: “what + why”

8. **PR Draft**

- Title format: `[main] <Imperative summary>`
- PR description sections:
  - Зачем
  - Что сделано
  - Как проверить
  - Риски
  - Скриншоты/видео (если UI)

Finally ask:

> “Reply APPLY to execute this plan EXACTLY for the listed files. Reply ADJUST to change the plan.”

---

## PHASE 2 — APPLY EXACT (ONLY AFTER USER SAYS "APPLY")

Only after the user replies **APPLY**, implement the plan.

### APPLY EXACT RULES (MANDATORY)

- You may ONLY change files listed in **EXACT APPLY FILE LIST** from the approved plan.
- If you discover that you must touch any additional file:
  1. STOP immediately
  2. explain why it’s needed
  3. provide an updated plan delta (new files + reason)
  4. ask for confirmation again (user must reply APPLY again)

### PLAN DEVIATION POLICY

- No “while I’m here” cleanup.
- No opportunistic refactors.
- No repo-wide formatting.
- If deviation is necessary, request re-approval.

---

# 🛑 STOP CONDITIONS (ALWAYS STOP AND ASK)

Stop and request confirmation if:

- the plan requires cross-app changes not implied by the request
- Supabase boundary would be violated
- you would need to touch auth/RLS/billing
- you would introduce a new architectural layer (widgets)
- you detect unavoidable large behavior change
- APPLY would require touching files outside the approved list

---

# DEFAULTS

- Mode: PLAN-ONLY
- Decomposition target: move implementations into `features/*`, keep pages in `pages/*`
- Shared UI target: `src/shared/ui`
- Apply behavior: APPLY EXACT (scope locked to approved file list)
