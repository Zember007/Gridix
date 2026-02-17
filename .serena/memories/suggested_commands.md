# Suggested Commands (Windows / PowerShell)

- Install deps: `pnpm install`
- Run all dev tasks (turbo): `pnpm dev`
- Run specific apps:
  - `pnpm dev:main`
  - `pnpm dev:agent`
  - `pnpm --filter @gridix/auth dev`
- Run checks across repo:
  - `pnpm turbo run lint`
  - `pnpm turbo run typecheck`
  - `pnpm turbo run build`
- Run checks for agent-cabinet only:
  - `pnpm --filter @gridix/agent-cabinet lint`
  - `pnpm --filter @gridix/agent-cabinet typecheck`
  - `pnpm --filter @gridix/agent-cabinet build`
- Useful workspace helper:
  - `pnpm dlx turbo run where <project_name>`
- Supabase types generation:
  - `pnpm --filter @gridix/types generate:types`
- CI-equivalent local sequence:
  1. `pnpm install`
  2. `pnpm turbo run lint`
  3. `pnpm turbo run typecheck`
  4. `pnpm turbo run build`
- Common shell utilities (PowerShell):
  - list files: `Get-ChildItem`
  - recursive search text: `Get-ChildItem -Recurse | Select-String -Pattern "..."`
  - git status/log: `git status`, `git log --oneline`
