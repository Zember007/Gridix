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
  - Within `apps/main`: prefer `@/shared/api/supabase`.
  - `@gridix/utils/api` is acceptable in `packages/*` or other apps where the wrapper doesn't exist.
- Respect existing ESLint boundaries (app-layer isolation, entity restrictions, etc.).
- Page-level composition must stay inside `pages/*`.
- Do NOT introduce new architectural layers (e.g., widgets) unless explicitly requested.
  - **Widgets are forbidden by default.** Allowed only if the user explicitly writes: `ALLOW_WIDGETS`.
- `components/*` is legacy: new/refactored logic should move into `features/*`, `entities/*`, or `shared/*`.
  - A thin wrapper in `components/*` is allowed only as a transitional re-export/adapter.
  - Wrapper must include a `// TODO: remove wrapper — direct import from <new-path>` comment. Plan its removal in a follow-up task.
- **Moving anything to `packages/ui` is forbidden by default.** Allowed only if the user explicitly writes: `ALLOW_PACKAGES_UI_PROMOTION`.

---

# 🧠 GRIDIX ARCHITECTURE MODEL

Gridix is **FSD-like hybrid** (especially in apps/main/src):

- app
- pages
- features
- entities
- shared
- legacy components (migration target)
- legacy `hooks/*` and `contexts/*` at `src/` root (migration target)

`hooks/*` and `contexts/*` at `src/` root are legacy. When a hook or context is touched during decomposition, migrate it to the appropriate FSD slice (`shared/hooks`, `entities/<entity>/hooks`, or `features/<feature>/context`).

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

## 4) Shared Lib

Shared Lib = **domain-agnostic utility / helper / constant**

- no UI
- no domain rules
- reusable across any layer

Destination: `shared/lib/...`

Examples:

- formatCurrency, formatArea → shared/lib/format
- validateEmail, validatePhone → shared/lib/validation
- debounce, throttle → shared/lib/utils

## 5) Types

- **Cross-app types** (used in 2+ apps or packages): `packages/types`
- **App-local domain types**: `entities/<entity>/model/types.ts`
- **Feature-scoped types**: `features/<feature>/model/types.ts`
- **Shared utility types**: `shared/types`

Do not duplicate types that already exist in `packages/types`.

## Gray-zone tie-breaker

If a piece is ambiguous (entity-ish vs feature-ish):

- No mutation / no side-effects → **entity**
- Has mutation but no orchestration → ask the user
- When in doubt → STOP and ask. Do not guess.

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

- Co-located assets (CSS modules, style files):
  - must move together with their component
  - include them in EXACT APPLY FILE LIST

---

# 📁 INTERNAL STRUCTURE STANDARD

When decomposition warrants it, use:

```
<slice>/
  api/
  model/
  hooks/
  context/
  ui/
  lib/
  index.ts
```

---

# 🧭 IMPORT POLICY

- Deep imports should be corrected by introducing/using `index.ts` barrels and updating imports.
- When creating a new FSD slice during decomposition, `index.ts` barrel is **mandatory**. The barrel defines the public API of the slice — all cross-layer imports must go through it.
- Keep import directions sane (avoid reverse dependencies).
- **Cross-entity imports are forbidden.** Entities must not import from other entities. If entity A needs data from entity B, lift the dependency to the feature or page that composes both.

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

**Tests:**

- If the moved component has co-located tests (`.test.tsx`, `.spec.tsx`), move them to the new location.
- Update test imports to match new paths.
- Do not create new tests unless explicitly requested.

---

# 📡 TANSTACK QUERY RULES

If you create/modify queries:

- Stabilize query keys (namespaced, non-generic)
  - Example: `["projects", projectId, "editor"]`
- Avoid keys like `["data"]`, `["list"]` without namespace
- If mutation: keep invalidation behavior intact
- Only check key hygiene within the changed scope (no repo-wide audit)

**Placement rules:**

- Entity read queries must live inside `entities/<entity>/queries` or `entities/<entity>/api`.
- Feature mutations must live inside `features/<feature>/api` or `features/<feature>/model`.
- Do not colocate entity queries inside features.

---

# 🌍 i18n RULES

- Prefer minimal touch.
- Add new keys only if new UI text appears.
- Do not mass-delete “dead keys” (separate task).
- If a moved component references i18n keys, verify the namespace still resolves. If keys use a component-path-based namespace, update accordingly.

---

# ✅ TWO-PHASE PROTOCOL (MANDATORY)

## PHASE 1 — PLAN ONLY (DEFAULT)

You MUST NOT change code in this phase.

### PRE-CHECK: IS DECOMPOSITION NEEDED?

Before building a plan, evaluate the target file against these criteria:

**Skip decomposition (NO-OP) if ALL of the following are true:**

1. The file is already inside a correct FSD layer (`features/*`, `entities/*`, `shared/*`, `pages/*`) — not in legacy `components/*`.
2. The file has a single clear responsibility (one feature, one entity, or pure UI).
3. The file does not mix layers (e.g., no entity queries inside a feature UI component, no mutations inside entity).
4. Import directions are correct (no reverse dependencies, no cross-entity imports).
5. The file is ≤300 lines OR is large but well-structured internally (clear sections, no god-component).

**If NO-OP applies, output:**

> **Assessment: No decomposition needed.**
>
> - File: `<path>`
> - Current layer: `<layer>` (correct)
> - Responsibility: `<single responsibility description>`
> - Lines: `<N>`
> - Reason: `<why decomposition would not improve the structure>`

Do NOT produce a full plan. Do NOT invent changes.

**If the file is in `components/*` (legacy)** — decomposition is almost always needed, even for small files. At minimum, propose moving it to the correct FSD layer. Exception: if the file is a thin wrapper that already re-exports from an FSD slice.

**If only a move is needed** (file is clean but in the wrong location) — produce a lightweight plan with only Move/Rename + Affected Importers. Skip Decomposition Map.

Proceed to full plan only if the file genuinely needs structural decomposition.

### LARGE FILE STRATEGY (for files >400 lines)

When the target file exceeds 400 lines, do NOT attempt to hold the entire file in context. Instead, use parallel subagents for discovery:

In prompts below, replace `<file>` with the actual target file path.

**Subagent 1 — Structure scan** (subagent_type: `explore`, run in parallel):

> "Read `<file>`. Return:
>
> 1. All exported components, hooks, functions, types — with line ranges (e.g., `ProjectForm: lines 120–280`).
> 2. All imports — what is imported and from where.
> 3. Logical sections if apparent (e.g., 'form logic', 'query hooks', 'UI rendering').
>    Do NOT return the full file contents — only the structural summary."

**Subagent 2 — Importer search** (subagent_type: `explore`, run in parallel):

> "Search the entire repo for every file that imports from `<file>`.
> Use grep/rg, do not guess. Return: file path + imported symbol for each match."

Wait for both results. Then proceed with classification using the structural summary, not the raw file.

If a specific section needs deeper inspection for classification, read only that line range — not the entire file again.

For files ≤400 lines, read the file directly — subagents are not needed.

### Output format

Output exactly:

1. **Target & Scope**

- What file/folder was requested
- What you inspected (key related files)

2. **Decomposition Map**

- List extracted parts and their classification: Feature / Entity / Shared UI / Shared Lib / Types
- Short rationale per part
- Migration complexity per part: **S** (rename/move only) / **M** (extract + rewire imports) / **L** (significant refactor, new abstractions)

3. **Proposed File Operations**

- New files to create (full paths)
- Files to move/rename (from → to)
- New/updated `index.ts` barrels
- Imports to update (high-level)

**Affected Importers (REQUIRED if Move/Rename present)**

- **You MUST use `grep`/`rg` (or a subagent with `explore`) to search the repo.** Do not rely on memory or guesses.
- List every file that imports the moved/renamed file.
- These files MUST be included in EXACT APPLY FILE LIST.
- If the moved/renamed piece is consumed from `packages/*`, check whether other apps (`auth`, `partners`, `agent-cabinet`) import it and add those consumers to the list.

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
- If the target imports or is imported by other fat legacy files (>300 lines), list them and suggest a decomposition order

6. **Verification Steps**

- Manual steps (what screens/actions to click)
- CI gates expected: lint / typecheck / build

7. **Commit Plan**

- Recommended order: (1) create new files/slices → (2) update imports to point to new paths → (3) remove/rename old files. Each intermediate commit must pass typecheck.
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

### ADJUST FLOW

If the user replies **ADJUST** (with comments):

1. Modify **only** the parts of the plan the user requested to change.
2. If the adjustment affects file operations or classification, re-check Affected Importers for the changed parts (use grep/rg).
3. Re-output the updated **EXACT APPLY FILE LIST** in full (not a diff).
4. Ask for APPLY again.

Do NOT re-run the entire Phase 1 unless the user explicitly asks.

---

## PHASE 2 — APPLY EXACT (ONLY AFTER USER SAYS "APPLY")

Only after the user replies **APPLY**, implement the plan.

### LARGE APPLY STRATEGY (when EXACT APPLY FILE LIST has >10 files)

When the plan involves more than 10 files, use subagents to apply changes in batches:

**Subagent per logical group** (subagent_type: `generalPurpose`):

Pass the subagent:

- the exact list of files to change, what to do with each file (create/modify/move)
- the relevant slice of the approved plan
- applicable code standards: NAMING RULES, barrel `index.ts` requirement, REACT RULES, TANSTACK QUERY placement rules

The subagent applies changes and reports back which files were modified.

**Constraints:**

- Max **4 subagents** running in parallel (Cursor limit). If more groups exist, queue them.
- Do NOT split a single file's changes across subagents. Each subagent handles complete files.

After all subagents complete, verify the result yourself: spot-check key files and confirm no unplanned changes were made.

### APPLY EXACT RULES (MANDATORY)

- You may ONLY change files listed in **EXACT APPLY FILE LIST** from the approved plan.
- If you discover that you must touch any additional file:
  1. STOP immediately
  2. explain why it’s needed
  3. provide an updated plan delta (new files + reason)
  4. ask for confirmation again (user must reply APPLY again)
- Any move/rename MUST include updating all importers listed in the plan.
- If during APPLY a new importer is discovered that was not listed, STOP and request plan delta approval.
- If APPLY fails mid-way, report exactly which files were successfully modified and which were not. Do not silently skip failures.

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

# ✅ DEFINITION OF DONE

- lint / typecheck / build pass.
- Runtime behavior preserved.
- No layer violations (respect FSD direction: shared → entities → features → pages).
- No new circular imports.
- No cross-entity imports.
- Hooks are correct (deps arrays, no conditional calls).
- Co-located tests (if any) moved and imports updated.
- Co-located styles moved together with their component.

---

# DEFAULTS

- Mode: PLAN-ONLY
- Decomposition target: move implementations into `features/*`, keep pages in `pages/*`
- Shared UI target: `src/shared/ui`
- Apply behavior: APPLY EXACT (scope locked to approved file list)
