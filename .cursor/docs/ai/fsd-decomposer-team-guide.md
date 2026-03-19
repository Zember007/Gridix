# Gridix FSD Decomposer: Team Guide

Документация для команды по использованию скила `gridix-fsd-decomposer`.

## Source of Truth

- Основные правила работы агента: `SKILL.md`.
- Расширенные редкие сценарии: `reference.md`.
- Этот файл (`docs/*`) — человекочитаемый гайд.

Если есть конфликт между файлами, приоритет у `SKILL.md`.

## Что делает скилл

- Безопасно декомпозирует крупные React+TS файлы по FSD.
- Переносит legacy из `components/*` в `features/*`, `entities/*`, `shared/*`.
- Сохраняет поведение и контролирует границы изменений через `APPLY EXACT`.

## Протокол работы

1. **PLAN ONLY** (по умолчанию)
   - код не меняется
   - скилл выдает план и список файлов
2. **ADJUST** (если надо поправить план)
3. **APPLY** (только после ревью)
   - изменения только в `EXACT APPLY FILE LIST`

## Формат ответа по умолчанию

По умолчанию скилл использует `COMPACT_PLAN` (короткий формат):

1. Target & Scope
2. Decomposition Map
3. File Operations + Affected Importers (+ `EXACT APPLY FILE LIST`)
4. Risk & Verification
5. Apply Gate

Если нужен подробный формат, явно пишите `FULL_PLAN`.

## Важные ограничения

- Нельзя трогать auth/RLS/billing.
- Нельзя прямой Supabase client import.
  - в `apps/main`: `@/shared/api/supabase`
  - в других местах: `@gridix/utils/api` (если app-wrapper отсутствует)
- Нельзя добавлять `widgets/*` без `ALLOW_WIDGETS`.
- Нельзя переносить в `packages/ui` без `ALLOW_PACKAGES_UI_PROMOTION`.
- Нельзя делать “попутный” cleanup/refactor/formatting вне задачи.
- Нельзя создавать новые тесты без явного запроса.

## Классификация (кратко)

- **Feature**: use-case + orchestration (+ side-effects)
- **Entity**: entity-представление и правила (+ optional read)
- **Shared UI**: presentation-only
- **Shared Lib**: domain-agnostic utility
- **Types**: cross-app -> `packages/types`, иначе локально по слайсу

Tie-break:

- нет mutation/side-effects -> Entity
- mutation без orchestration -> уточнить у пользователя
- сомнение -> остановиться и спросить

## Куда что переносится

| Тип                                     | Куда                 |
| --------------------------------------- | -------------------- |
| use-case / orchestration / side-effects | `features/*`         |
| entity UI + read logic                  | `entities/*`         |
| чистый переиспользуемый UI              | `src/shared/ui/*`    |
| утилиты / хелперы / константы           | `shared/lib/*`       |
| page composition                        | остается в `pages/*` |

## REVIEW-чеклист для команды

Перед `APPLY` проверьте:

- корректна ли классификация (feature/entity/shared)
- нет ли выхода за `EXACT APPLY FILE LIST`
- учтены ли все `Affected Importers` (через `rg`/`explore`)
- нет ли cross-entity imports
- нет ли нарушений FSD направления и reverse dependencies
- не нарушены ли запреты (auth/RLS/billing/widgets/packages/ui)

## Stop Conditions (когда скилл обязан остановиться)

- требуется изменить файлы вне утвержденного списка
- обнаружен новый импортер вне плана
- нужны cross-app изменения, не вытекающие из задачи
- возникает риск крупного поведенческого изменения

## Большие файлы и большие APPLY

- Для файлов `>400` строк скилл использует стратегию с subagents.
- Для APPLY с большим списком файлов применяется пакетная стратегия.
- Подробности в `reference.md`.

## Пример запроса

```text
Используй skill gridix-fsd-decomposer.

PLAN для:
apps/main/src/components/admin/LeadsManager.tsx

Ограничения:
- Не изменять pages/*
- Сохранить текущее поведение
- Использовать Supabase wrapper

Цель:
Разделить UI, entity-часть и feature-оркестрацию.
```

## Как правильно запускать APPLY

1. Получить план.
2. Проверить `EXACT APPLY FILE LIST`.
3. Проверить `Affected Importers`.
4. При необходимости отправить `ADJUST`.
5. Отправить `APPLY` только после ревью.

## Maintenance Policy

- Любое изменение `SKILL.md` должно сопровождаться проверкой этого docs-файла.
- Если меняется протокол, форматы или запреты, docs обновляется в том же PR/commit.
- Рекомендуется держать docs кратким и не дублировать весь `reference.md`.
