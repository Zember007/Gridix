# Task Completion Checklist

- If `supabase/functions/*` changed, deploy affected function(s): `supabase functions deploy <function_name>`.
- Run CI-equivalent checks from `.github/workflows/ci.yml`:
  1. `pnpm turbo run lint`
  2. `pnpm turbo run typecheck`
  3. `pnpm turbo run build`
- For scoped UI fixes in `agent-cabinet`, at minimum run package-level verification:
  - `pnpm --filter @gridix/agent-cabinet lint`
  - `pnpm --filter @gridix/agent-cabinet typecheck`
  - `pnpm --filter @gridix/agent-cabinet build`
- Keep commit messages in format: `[<project_name>] <Short Imperative Description>`.
- Ensure no unrelated files are reverted; preserve user changes in dirty trees.
