# PR Title

[agent-cabinet] Redesign catalog units chessboard

## Summary

Updated the units chessboard in the agent catalog drawer to match the requested visual reference and interaction details.

## Changes

- Reworked chessboard layout to show all floors as rows instead of a selected-floor panel.
- Added dynamic legend counters for `available`, `booked`, and `sold`.
- Applied requested status palette via Tailwind tokens:
  - `available`: `emerald-400`
  - `booked`: `amber-400`
  - `sold`: `slate-300`
- Updated cell content rules:
  - Removed `№` prefix from apartment numbers.
  - `available` shows formatted price (`$48K` style).
  - `booked` shows translated booked label.
  - `sold` shows translated sold label.
- Reduced tile visual weight and size to better match the reference.
- Removed nested inner scroll behavior in chessboard area to avoid multiple simultaneous scrollbars.
- Fixed translation key path for legend labels and added empty-state i18n key:
  - `common.drawer.units.empty` in:
    - `apps/agent-cabinet/src/locales/ru/common.json`
    - `apps/agent-cabinet/src/locales/en/common.json`

## Testing

1. `pnpm --filter @gridix/agent-cabinet exec eslint src/pages/tabs/CatalogTab.tsx` ✅
2. `pnpm --filter @gridix/agent-cabinet lint` ✅
3. `pnpm --filter @gridix/agent-cabinet typecheck` ❌
   - Fails due to pre-existing unused imports in `apps/agent-cabinet/src/pages/tabs/AgentSettingsTab.tsx` (not related to this PR).

## Checklist

- [ ] `pnpm turbo run typecheck` passes
- [ ] `pnpm turbo run lint` passes
- [x] No secrets in code
- [x] Tested locally
