---
name: gridix-fsd-routing
description: Правила маршрутизации изменений по FSD-слоям и импорт-границам Gridix (apps/* + packages/*), с stop conditions при неоднозначности.
---

# Gridix FSD Routing

Решает только задачу "куда класть изменения" в FSD-структуре Gridix.

## Output contract (обязателен)

- Язык: русский.
- По умолчанию: compact.
- Детальный разбор: только по запросу.
- Минимальный формат ответа:
  - `Decision`
  - `Target paths`
  - `Import boundaries`
  - `Risks`
  - `Questions` или `Assumptions`

## Apply gates (обязательны)

- Этот skill сам не применяет изменения к файлам.
- Для изменения кода нужен явный `APPLY` от пользователя.
- Для корректировки решения используй `ADJUST` и перевыпусти полный `Decision` + `Target paths`.

## Routing policy

1. `shared`:
   - UI/утилиты без доменной логики.
2. `entities`:
   - модель предметной сущности, чтение данных, типизация сущности.
3. `features`:
   - пользовательский use-case, оркестрация действий, мутации.
4. `pages`:
   - композиция экранов и флоу страницы.
5. `app`:
   - bootstrap, провайдеры, роутинг уровня приложения.

## Monorepo boundaries

- Изменения внутри `apps/main/src` держи в FSD-слоях приложения.
- Кросс-приложечные типы/утилиты - в `packages/types` или `packages/utils`.
- Не переноси UI в `packages/ui`, если это не явно кросс-приложечный компонент.

## Import boundaries

- Разрешенное направление: `shared -> entities -> features -> pages -> app`.
- Запрещено:
  - обратные зависимости слоев;
  - cross-entity imports напрямую;
  - импорты в обход публичного API slice (когда нужен `index.ts`).

## Формат ответа (compact)

```md
Decision:

- ...
  Target paths:
- create: ...
- modify: ...
  Import boundaries:
- allowed: ...
- forbidden: ...
  Risks:
- ...
  Questions:
- ...
```

Если вопросов нет, используй `Assumptions`.

## Stop conditions

- Один и тот же кусок кода одинаково обоснован для разных слоев.
- Нужны изменения архитектуры, выходящие за текущий scope.
- Требуются затрагивания нескольких приложений без явного запроса.

В этих случаях остановись и запроси уточнение вместо догадки.
