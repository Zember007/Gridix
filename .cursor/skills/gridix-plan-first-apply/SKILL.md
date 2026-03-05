---
name: gridix-plan-first-apply
description: Plan-first workflow для Gridix: PLAN-ONLY по умолчанию, APPLY только по явному подтверждению, строго в рамках exact file list.
---

# Gridix Plan-First Apply

Координирует переход от плана к реализации без выхода за согласованный scope.

## Output contract (обязателен)

- Язык: русский.
- По умолчанию compact, без длинной теории.
- Полная детализация только по запросу.
- В каждом отчете обязательно:
  - `Plan`
  - `EXACT APPLY FILE LIST`
  - `Manual verify`
  - `Checks run/skipped` (1-2 строки)

## Gate model (обязателен)

- По умолчанию: `PLAN-ONLY` (никаких изменений файлов).
- `ADJUST`: обновить план и полностью перевыпустить `EXACT APPLY FILE LIST`.
- `APPLY`: разрешение на реализацию. Без явного `APPLY` изменения запрещены.

## APPLY strict mode

- Менять можно только файлы из согласованного `EXACT APPLY FILE LIST`.
- Если требуется еще один файл:
  1. остановиться;
  2. объяснить причину;
  3. показать delta к списку;
  4. запросить новый `APPLY`.
- Запрещены "попутные" рефакторы вне списка.

## Формат план-ответа (compact)

```md
Plan:

1. ...
2. ...
   EXACT APPLY FILE LIST:

- modify: ...
- create: ...
- move/rename: ...
  Manual verify:
- ...
  Checks run/skipped: run: ...; skipped: ...
  Gate: Reply ADJUST or APPLY
```

## Формат apply-отчета (compact)

```md
Итог APPLY:

- created: N
- modified: N
- moved/renamed: N
- deleted: N
- notes: ...
  Manual verify:
- ...
  Checks run/skipped: run: ...; skipped: ...
```

## Матрица проверок

- `targeted`:
  - docs/rules/skills changes -> heavy checks можно пропустить.
  - single package runtime changes -> `lint` + `typecheck` только целевого пакета.
- `root`:
  - cross-package/рискованные изменения -> `pnpm turbo run lint` + `pnpm turbo run typecheck`.
  - `build` только при существенных изменениях.
