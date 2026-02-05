# Gridix Application

> ⚠️ **PROPRIETARY SOFTWARE**: This repository contains proprietary code. See [LICENSE](./LICENSE) for terms.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Onboarding / First Setup](#onboarding--first-setup)
- [Environment Variables](#environment-variables)
- [Supabase Development](#supabase-development)
- [Local Development](#local-development)
- [Building for Production](#building-for-production)
- [Testing & Validation](#testing--validation)
- [Troubleshooting](#troubleshooting)

---

## Repository Structure

```
gridix-app/
├── apps/                          # Applications
│   ├── main/                      # Main client application (Vite + React)
│   ├── agent-cabinet/             # Agent cabinet application
│   └── auth/                      # SSO/Authentication application
├── packages/                      # Shared packages
│   ├── ui/                        # Shared UI components (@gridix/ui)
│   ├── utils/                     # Shared utilities, Supabase client (@gridix/utils)
│   ├── types/                     # TypeScript types, DB types (@gridix/types)
│   └── config/                    # Shared configs (TypeScript, ESLint)
├── supabase/                      # Supabase configuration
│   ├── config.toml                # Supabase project config
│   ├── functions/                 # Edge Functions
│   └── migrations/                # Database migrations
├── .env.example                   # Environment template
├── pnpm-workspace.yaml            # pnpm workspace config
└── turbo.json                     # Turborepo config
```

---

## Onboarding / First Setup

### Prerequisites

- **Node.js** 22+ 
- **pnpm** 9.x (`npm install -g pnpm`)
- **Supabase CLI** (`pnpm add -g supabase`)
- Access to a **DEV Supabase project** (ask project owner)

### Step-by-Step Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd gridix-app

# 2. Install dependencies
pnpm install

# 3. Create environment files
cp .env.example .env
cp .env apps/main/.env
cp .env apps/agent-cabinet/.env
cp .env apps/auth/.env

# 4. Edit .env files with your DEV Supabase credentials
# See "Environment Variables" section below

# 5. Link to DEV Supabase project (if working with backend)
cd supabase
supabase link --project-ref <YOUR_DEV_PROJECT_REF>
supabase db push  # Apply migrations
cd ..

# 6. Start development server
pnpm dev:main
```

### Quick Start Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev:main` | Start main app at http://localhost:8080 |
| `pnpm dev:agent` | Start agent cabinet at http://localhost:8081 |
| `pnpm turbo run build` | Build all packages and apps |
| `pnpm turbo run typecheck` | Run TypeScript checks |
| `pnpm turbo run lint` | Run linting |

---

## Environment Variables

All applications require environment configuration. **Never commit `.env` files!**

### Where to Get Values

1. Go to your **DEV** Supabase project Dashboard: https://supabase.com/dashboard
2. Navigate to: **Settings → API**
3. Copy the required values

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_PROJECT_ID` | Project reference ID | Settings → General |
| `VITE_SUPABASE_URL` | Project URL | Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/public key | Settings → API → anon/public |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_SSO_URL` | Auth app URL | `http://localhost:5175` |
| `VITE_MAIN_APP_URL` | Main app URL (for auth redirects) | `http://localhost:8080` |
| `VITE_AGENT_CABINET_URL` | Agent cabinet URL | `http://localhost:8081` |
| `VITE_SERVER_DOMAIN` | Server domain | `localhost:8080` |

### Example `.env` for Development

```env
VITE_SUPABASE_PROJECT_ID="your-dev-project-id"
VITE_SUPABASE_URL="https://your-dev-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOi..."
VITE_SSO_URL="http://localhost:5175"
VITE_MAIN_APP_URL="http://localhost:8080"
VITE_AGENT_CABINET_URL="http://localhost:8081"
```

> ⚠️ **Important**: Use DEV Supabase project credentials only. Production credentials are managed via CI/CD.

---

## Supabase Development

### Initial Setup

1. **Request access** to the DEV Supabase project from the project owner
2. **Link your local project**:
   ```bash
   cd supabase
   supabase link --project-ref <DEV_PROJECT_REF>
   ```
3. **Apply migrations**:
   ```bash
   supabase db push
   # or
   supabase migration up
   ```

### Edge Functions

Edge Functions require secrets to be set in the Supabase Dashboard.

**To deploy functions:**
```bash
supabase functions deploy                              # Deploy all
supabase functions deploy <function-name>             # Deploy specific
supabase functions deploy --project-ref <PROJECT_REF> # Explicit project
```

**Setting secrets:**
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add required environment variables (e.g., `AMOCRM_*`, `JWT_SECRET`, `ONESIGNAL_*`)

> ⚠️ Only set TEST/DEV values for secrets. Production secrets are configured separately.

### Database Types Generation

After schema changes, regenerate TypeScript types:

```bash
# Ensure .env has VITE_SUPABASE_PROJECT_ID set
pnpm --filter @gridix/types generate:types
```

This updates `packages/types/src/database.ts` with the latest schema.

### Working with Migrations

```bash
# Create new migration
supabase migration new <migration_name>

# Apply migrations to DEV
supabase db push

# Check migration status
supabase migration list
```

---

## Local Development

### Запуск dev сервера

```bash
# Из корня монорепозитория
pnpm dev:main

# Или напрямую
pnpm --filter @gridix/main dev
```

Приложение будет доступно на `http://localhost:8080`

### Запуск agent-cabinet

```bash
pnpm dev:agent

# Или
pnpm --filter @gridix/agent-cabinet dev
```

Приложение будет доступно на `http://localhost:8081`

### Running Multiple Apps

```bash
# In separate terminals:
pnpm dev:main          # Terminal 1 - Main app (8080)
pnpm dev:agent         # Terminal 2 - Agent cabinet (8081)
pnpm --filter @gridix/auth dev  # Terminal 3 - Auth (5175)
```

---

## Building for Production

### Основное приложение

```bash
# Установка зависимостей (если еще не установлены)
pnpm install

# Сборка основного приложения
pnpm --filter @gridix/main build

# Результат будет в apps/main/dist/
```

### Сборка виджета

```bash
pnpm --filter @gridix/main build:widget

# Результат будет в public/widget/
```

### Сборка всех пакетов

```bash
# Сборка всех packages и apps
pnpm turbo run build

# Или только packages
pnpm turbo run build --filter='./packages/*'
```

### Структура после сборки

```
gridix-app/
├── apps/
│   ├── main/
│   │   └── dist/              # ← Продакшен сборка основного приложения
│   │       ├── index.html
│   │       └── assets/
│   └── agent-cabinet/
│       └── dist/              # ← Продакшен сборка agent-cabinet
├── public/
│   └── widget/                # ← Виджет (если собран)
│       ├── index.js
│       └── style.css
└── packages/
    ├── ui/
    │   └── dist/              # ← Собранные UI компоненты (если настроено)
    └── ...
```

---

## Testing & Validation

### CI Pipeline Commands

Before pushing, run the same checks as CI:

```bash
# TypeScript type checking
pnpm turbo run typecheck

# Linting
pnpm turbo run lint

# Build verification
pnpm turbo run build
```

### Production Build Checklist

- [ ] `pnpm install` выполнен успешно
- [ ] `pnpm turbo run typecheck` проходит без ошибок
- [ ] `pnpm turbo run lint` проходит без ошибок
- [ ] `pnpm --filter @gridix/main build` завершается успешно
- [ ] `apps/main/dist/` содержит все необходимые файлы
- [ ] `index.html` существует в `apps/main/dist/`
- [ ] Все environment variables настроены

---

## Troubleshooting

### 1. Ошибка: "Cannot find module @gridix/ui"

**Причина:** Workspace packages не установлены

**Решение:**
```bash
pnpm install
```

### 2. Ошибка: "tsconfig extends not found"

**Причина:** Неправильные пути в tsconfig.json

**Решение:** Используйте относительные пути:
```json
{
  "extends": "../../packages/config/typescript/tsconfig.base.json"
}
```

### 3. Ошибка: "Module not found" для workspace packages

**Причина:** Неправильные импорты

**Решение:** Убедитесь, что используете правильные импорты:
```typescript
// ✅ Правильно
import { Button } from '@gridix/ui';
import { cn } from '@gridix/utils/lib';

// ❌ Неправильно
import { Button } from '/ui';
import { Button } from '@/shared/ui/button';
```

### 4. Ошибка сборки: "Rollup failed to resolve import"

**Причина:** Неправильные пути импортов или отсутствующие зависимости

**Решение:**
1. Проверьте все импорты в коде
2. Убедитесь, что все workspace packages имеют правильные `package.json`
3. Выполните `pnpm install` заново

### 5. Supabase CLI errors

**"Project not linked":**
```bash
cd supabase
supabase link --project-ref <YOUR_DEV_PROJECT_REF>
```

**"Migration failed":**
```bash
# Check status
supabase migration list

# Reset if needed (⚠️ destroys data!)
supabase db reset
```

### 6. Types out of sync with database

```bash
# Regenerate types
pnpm --filter @gridix/types generate:types
```

---

## Очистка и оптимизация

### Использование Turborepo кэша

Turborepo автоматически кэширует результаты сборки:

```bash
# Первая сборка (медленнее)
pnpm turbo run build

# Последующие сборки (быстрее, использует кэш)
pnpm turbo run build
```

### Очистка кэша

```bash
# Очистка кэша Turborepo
pnpm turbo run clean

# Очистка node_modules и переустановка
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/)
