# Contributing Guidelines

## Security Requirements

### ⚠️ CRITICAL: What NEVER to Commit

The following must **NEVER** be committed to this repository:

| File/Secret                         | Reason               |
| ----------------------------------- | -------------------- |
| `.env` files                        | Contains credentials |
| `SUPABASE_SERVICE_ROLE_KEY`         | Full database access |
| Production Supabase keys            | Security breach risk |
| AmoCRM/Bitrix API keys              | Third-party access   |
| OneSignal keys                      | Notification access  |
| JWT secrets                         | Auth bypass risk     |
| Any `*_SECRET` or `*_KEY` variables | Security             |

### Pre-Commit Checklist

Before every commit, verify:

- [ ] No `.env` files in staged changes (`git status`)
- [ ] No hardcoded API keys or tokens in code
- [ ] No production URLs or credentials in config files
- [ ] `supabase/config.toml` does not contain production `project_id`

### If You Accidentally Committed Secrets

1. **DO NOT PUSH** if not yet pushed
2. Remove the commit: `git reset HEAD~1`
3. If already pushed: **immediately notify the project owner**
4. The secret must be rotated (changed) in Supabase/service dashboard

---

## Development Environment

### Required: DEV Supabase Project

You must use a **separate DEV Supabase project** for development:

- ✅ Use DEV project credentials in your local `.env`
- ✅ Deploy Edge Functions to DEV project
- ✅ Run migrations on DEV project
- ❌ **Never** use production credentials locally
- ❌ **Never** deploy directly to production

### Getting DEV Access

1. Request DEV Supabase project access from the project owner
2. You will receive:
   - DEV Project Reference ID
   - DEV Supabase URL
   - DEV Anon/Publishable Key
3. You will **NOT** receive:
   - Production credentials
   - Service role keys (unless specifically needed)

---

## Development Workflow

### 1. Setup (One-time)

```bash
# Clone and install
git clone <repo>
cd gridix-app
pnpm install

# Create env files
cp .env.example .env
cp .env apps/main/.env
cp .env apps/agent-cabinet/.env
cp .env apps/auth/.env
# Edit with DEV credentials

# Link Supabase
cd supabase
supabase link --project-ref <DEV_PROJECT_REF>
supabase db push
```

### 2. Daily Development

```bash
# Pull latest changes
git pull origin main

# Start development
pnpm dev:main  # or pnpm dev:agent

# Before committing
pnpm turbo run typecheck
pnpm turbo run lint
```

### 3. Making Changes

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes...

# Verify before commit
pnpm turbo run typecheck
pnpm turbo run lint
pnpm turbo run build

# Commit
git add .
git commit -m "[app-name] Description of changes"
```

### 4. Database Changes

If you need to modify the database schema:

```bash
# Create migration
cd supabase
supabase migration new your_migration_name

# Edit the migration file in supabase/migrations/

# Apply to DEV
supabase db push

# Regenerate types
cd ..
pnpm --filter @gridix/types generate:types

# Test thoroughly before PR
```

### 5. Edge Functions

```bash
# Develop locally
supabase functions serve <function-name>

# Deploy to DEV
supabase functions deploy <function-name>

# Set secrets in DEV Dashboard
# Dashboard → Settings → Edge Functions → Add secret
```

---

## Code Standards

### TypeScript

- **Strict mode** always enabled
- No `any` types - use `unknown` or specific types
- All props must be typed with interfaces

### Imports

```typescript
// ✅ Correct
import { Button } from "@gridix/ui";
import { supabase } from "@gridix/utils";
import type { Database } from "@gridix/types/database";

// ❌ Incorrect
import { Button } from "../../packages/ui";
import { something } from "@/shared/something";
```

### Database Types

Always use generated Supabase types:

```typescript
import type { Database } from "@gridix/types/database";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
```

---

## Pull Request Guidelines

### PR Title Format

```
[package-name] Short imperative description
```

Examples:

- `[main] Add project filtering by status`
- `[agent-cabinet] Fix dashboard loading state`
- `[types] Regenerate database types for new schema`

### PR Description Template

```markdown
## Summary

Brief description of changes

## Changes

- Change 1
- Change 2

## Testing

How to test these changes

## Checklist

- [ ] `pnpm turbo run typecheck` passes
- [ ] `pnpm turbo run lint` passes
- [ ] No secrets in code
- [ ] Tested locally
```

---

## Deployment

### ⚠️ Production Deployment

- Production deployments are handled **exclusively** via CI/CD
- You do **not** have access to production credentials
- Merging to `main` triggers automatic deployment

### DEV Deployment

You can deploy to the DEV environment:

```bash
# Edge Functions only
supabase functions deploy --project-ref <DEV_PROJECT_REF>

# Migrations
supabase db push
```

---

## Getting Help

- **Technical issues**: Open a GitHub issue
- **Access requests**: Contact project owner
- **Security concerns**: Immediately notify project owner

---

## Separating Backend (Advanced)

If the backend (Supabase) needs to be in a separate repository:

### Option A: Git Submodule

```bash
# In a new repo (gridix-backend)
# Move supabase/ folder there

# In main repo
git submodule add <backend-repo-url> supabase
```

### Option B: Separate Repository

1. Create `gridix-backend` repo with `supabase/` contents
2. Remove `supabase/` from main repo
3. Types: Generate in backend repo, publish as npm package or copy to `packages/types`

See project owner for guidance on which approach to use.
