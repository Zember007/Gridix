## PR Title Options

- `[agent-cabinet] Fix responsive layouts across cabinet tabs and partner program`
- `[agent-cabinet] Improve mobile and tablet styling in dashboard, analytics, catalog, and partner program`

## Summary

Responsive behavior in `agent-cabinet` was improved across key tabs: horizontal overflow issues were removed, headers and search blocks were aligned, table and sidebar behavior on mobile was refined, and Partner Program styles were updated in related UI components.

## Changes

- Fixed mobile scrolling on Dashboard and layering for the floating support button.
- Improved responsive table layout in ContactsTab.
- Fixed search alignment in ModuleHeader for desktop/mobile scenarios.
- Removed horizontal overflow in Analytics and updated responsive header layout.
- Added `partner-program` to Tailwind content scan to ensure styles are generated correctly.
- Improved responsive styles for Partner Program tab and sections in `packages/partner-program` (overview, account, clients, referrals, instructions, payouts).
- Refined CatalogTab and related UI styles.
- Updated mobile sidebar behavior in `packages/ui` (language menu and floating support button).
- Removed legacy `.js` component versions and kept the current `.tsx` implementations.

## Testing

- `pnpm turbo run typecheck`
- `pnpm turbo run lint`
- `pnpm turbo run build`
- Manual verification in `agent-cabinet`:
  - Dashboard / Contacts / Analytics / Catalog / Partner Program
  - breakpoints: mobile, tablet, desktop
  - validation of no horizontal overflow and correct sidebar/support button behavior

## Checklist

- [ ] `pnpm turbo run typecheck` passes
- [ ] `pnpm turbo run lint` passes
- [ ] No secrets in code
- [ ] Tested locally
