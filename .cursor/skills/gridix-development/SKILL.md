---
name: gridix-development
description: Проектный workflow и стандарты разработки для репозитория Gridix (gridix-app): pnpm/turbo команды, проверки как в CI (lint/typecheck/build), фронтенд-конвенции (TS strict, React, Tailwind) и Supabase практики (MCP для схемы/миграций, edge functions). Использовать при разработке, правках багов/фич, подготовке PR и когда пользователь упоминает Gridix/gridix-app, pnpm, turbo, lint, typecheck, build, Supabase.
---

# Gridix Development (project skill)

## Quick start (делай так по умолчанию)

- **Источник правды для проверок**: всегда сначала смотри `.github/workflows/ci.yml`, затем локально повторяй те же шаги.
- **Пакетный менеджер**: только `pnpm` (не `npm`, не `yarn`).
- **Монорепо**: запускай команды через `turbo` или `pnpm --filter`.

### Команды как в CI

```bash
pnpm install
pnpm turbo run lint
pnpm turbo run typecheck
pnpm turbo run build
```

## Workflow разработки в монорепо

1. **Определи, где менять код**:
   - Приложения: `apps/*` (например, `apps/main`, `apps/agent-cabinet`)
   - Общие пакеты: `packages/*` (например, `packages/ui`, `packages/utils`, `packages/types`)
2. **Найди имя пакета для фильтра**:
   - Открой соответствующий `package.json` и используй поле `name` как `<project_name>` в `pnpm --filter <project_name> ...`.
3. **Запускай точечно (если нужно)**:

```bash
pnpm --filter <project_name> lint
pnpm --filter <project_name> typecheck
pnpm --filter <project_name> build
```

> Если неясно, какой пакет затронут, предпочитай общий прогон через `pnpm turbo run <task>`.

## Frontend-конвенции (Gridix)

- **TypeScript строгий**:
  - Не используй `any` (используй `unknown` или конкретные типы).
  - Для объектов предпочитай `interface`, для union/intersection — `type`.
  - Всегда типизируй props компонентов.
- **UI/Shared**:
  - Переиспользуй компоненты/утилиты из `packages/ui` и `packages/utils` вместо копипаста.
  - Стили: Tailwind, mobile-first.
- **Работа с фреймворком**:
  - Перед тем как давать архитектурные советы (Next.js vs Vite), проверь `apps/<app>/package.json` и `vite.config.*` / `next.config.*`.

## Supabase (обязательные практики)

- **Схема/миграции/SQL**: используй Supabase MCP для инспекции схемы, запуска SQL и подготовки миграций (не “угадывай” структуру таблиц).
- **Типы Supabase**: используй автогенерируемые типы из `packages/types` (не пиши схемы таблиц вручную).
- **Edge Functions**:
  - Любые изменения в `supabase/functions/**` требуют последующего `supabase functions deploy <function_name>`.

## Definition of Done (перед PR)

- [ ] Линт проходит: `pnpm turbo run lint`
- [ ] Типы проходят: `pnpm turbo run typecheck`
- [ ] Сборка проходит: `pnpm turbo run build`
- [ ] Нет неуместных изменений (случайные `.turbo/**`, временные файлы, secrets)

