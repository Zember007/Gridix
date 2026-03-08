# Gridix FSD Decomposer Reference

Use this file only for complex cases. Default behavior remains in `SKILL.md`.

## 1) Large File Discovery (>400 lines)

When target file is larger than 400 lines:

- Run two parallel `explore` subagents:
  1. Structure scan:
     - exports (components/hooks/functions/types) + line ranges
     - imports and sources
     - logical sections
  2. Importer search:
     - all files importing target file
     - imported symbols per file
- Classify using structural summary first.
- Read only specific ranges if needed for ambiguous blocks.
- Avoid re-reading full file repeatedly.

For files <=400 lines, inspect directly.

## 2) Apply Batching (>10 files)

If `EXACT APPLY FILE LIST` has more than 10 files:

- Split into logical groups and use `generalPurpose` subagents.
- Max 4 parallel subagents.
- One file must be handled by one subagent only.
- After all groups complete:
  - verify key files manually
  - ensure no unplanned file edits happened

## 3) Classification Details

Feature signals:

- user intent (save/publish/upload/approve/sync/etc.)
- orchestration of multiple steps
- side-effects (mutation/toast/navigation/invalidation/analytics)

Entity signals:

- representation + entity-local rules
- optional read queries
- no orchestration

Shared UI signals:

- generic presentational UI
- no domain decisions

Shared Lib signals:

- pure utility/constants
- reusable without domain coupling

Gray zone:

- mutation with no clear orchestration -> ask user before deciding

## 4) Importer Integrity Checklist

For every move/rename:

- find all importers via `rg`/`explore`
- include all importers in `EXACT APPLY FILE LIST`
- update barrels (`index.ts`) where needed
- verify no cross-entity imports appear after refactor

If an unlisted importer appears during APPLY, stop and request plan delta approval.

## 5) Compactness Rules

To reduce token usage:

- prefer bullets over prose
- avoid repeating global constraints in each section
- avoid multi-paragraph rationale unless user requests `FULL_PLAN`
- keep examples to one short line per item
