# Gridix Skills Workflow (compact)

Короткая команда-инструкция по workflow `triage -> plan-first-apply -> review -> APPLY`.

## Общий output-контракт (для всех 4 skills)

- Язык: русский.
- Формат: compact по умолчанию.
- Full-on-demand: детальная версия только по явному запросу.
- Для plan/apply задач обязательны блоки:
  - `EXACT APPLY FILE LIST`
  - `Manual verify`
  - `Checks run/skipped`

## Apply gates (единые)

- `PLAN-ONLY` по умолчанию.
- `ADJUST` - скорректировать план/оценку без изменения файлов.
- `APPLY` - единственный допустимый сигнал на изменение файлов.
- Если в apply нужен файл вне `EXACT APPLY FILE LIST`, работа останавливается до повторного подтверждения.

## Когда запускать какой skill

- `gridix-task-triage`:
  - вход: сырая задача/скрин;
  - выход: короткий SPEC (Goal, Context/Route, Scope, DoD, Repro, Questions/Assumptions).
- `gridix-fsd-routing`:
  - вход: что нужно разместить по слоям;
  - выход: решение "куда класть" + целевые пути + границы импортов.
- `gridix-ui-standards`:
  - вход: UI-задача или проверка UI-изменений;
  - выход: checklist, риски регрессий, минимальный smoke.
- `gridix-plan-first-apply`:
  - вход: подтвержденный scope изменений;
  - выход: план, точный file list, gate-ready отчет для `ADJUST/APPLY`.

## Границы skills (чтобы не дублировались)

- triage = формулировка задачи и DoD.
- fsd-routing = решение по слоям и путям.
- ui-standards = только UI-качество и риски.
- plan-first-apply = управление планом и безопасным переходом к APPLY.
- `gridix-fsd-decomposer` остается отдельным инструментом для decomposition/migration legacy.

## Матрица запусков проверок

- `targeted`:
  - docs/rules/skills only: heavy checks можно пропустить;
  - single package runtime: `pnpm --filter <pkg> lint` + `pnpm --filter <pkg> typecheck`.
- `root`:
  - cross-package или повышенный риск: `pnpm turbo run lint` + `pnpm turbo run typecheck`.
  - `pnpm turbo run build` - только при существенных изменениях.

В каждом отчете добавляй строку:

- `Checks run/skipped: run: ...; skipped: ...`

## Dry-run scenarios (без изменений кода продукта)

Дата прогона: 2026-03-05.

### 1) UI bug ticket

- Сценарий: "На iOS в модалке уезжает контент и появляется двойной scroll".
- Проверка формата:
  - triage выдает compact SPEC с `Repro`.
  - ui-standards выдает `Checklist`, `Regression risks`, `Manual smoke`.
- Проверка gates:
  - до `APPLY` изменений файлов нет;
  - при `ADJUST` выдается обновленный compact-ответ без apply.
- Статус: PASS.

### 2) Новая UI-страница

- Сценарий: "Добавить страницу со списком заявок и фильтрами".
- Проверка формата:
  - triage -> fsd-routing -> plan-first-apply с `EXACT APPLY FILE LIST`.
  - присутствуют `Manual verify` и `Checks run/skipped`.
- Проверка gates:
  - без явного `APPLY` только план и file list;
  - `ADJUST` обновляет весь список файлов целиком.
- Статус: PASS.

### 3) Оптимизация рендера

- Сценарий: "Снизить лишние ререндеры таблицы на dashboard".
- Проверка формата:
  - fsd-routing фиксирует target paths и import boundaries.
  - plan-first-apply возвращает compact-план + gate.
- Проверка gates:
  - apply-mode не стартует без команды `APPLY`;
  - при необходимости файла вне списка требуется re-approval.
- Статус: PASS.

## Минимальный шаблон финального отчета

```md
Plan:

1. ...
   EXACT APPLY FILE LIST:

- modify: ...
  Manual verify:
- ...
  Checks run/skipped: run: ...; skipped: ...
  Gate: Reply ADJUST or APPLY
```
