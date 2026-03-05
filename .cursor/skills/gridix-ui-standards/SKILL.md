---
name: gridix-ui-standards
description: Компактный UI-стандарт для Gridix: checklist (responsive/a11y/i18n/states), типовые риски регрессий и минимальный manual smoke.
---

# Gridix UI Standards

Skill для быстрой UI-валидации решений до и после изменений.

## Output contract (обязателен)

- Язык: русский.
- Формат: compact по умолчанию.
- Полный разбор: только по запросу.
- Используй фиксированные блоки:
  - `Checklist`
  - `Regression risks`
  - `Manual smoke`
  - `Checks run/skipped` (1-2 строки)

## Apply gates (обязательны)

- По умолчанию анализ и рекомендации без правок.
- Любые изменения файлов выполняются только после явного `APPLY`.
- Изменение рекомендаций без правок выполняется через `ADJUST`.

## UI checklist (минимум)

- Responsive:
  - mobile-first, корректные брейкпоинты, без горизонтального скролла.
- A11y:
  - видимый focus, aria-label/role по необходимости, контраст и клавиатурная навигация.
- i18n:
  - новый текст через ключи локализации, без хардкода строк интерфейса.
- States:
  - loading / empty / error / disabled / success покрыты явно.

## Обязательные риски регрессий

- iOS/Safari поведение sticky/fixed.
- Scroll/overflow в модалках и nested контейнерах.
- Обрезание текста и переносы на малых экранах.
- Клики по интерактивам в зоне перекрытий (z-index/pointer-events).

## Manual smoke (минимум)

1. Открыть экран на mobile и desktop.
2. Проверить ключевые CTA в нормальном и disabled состоянии.
3. Провалидировать loading/empty/error.
4. Проверить локализацию новых текстов.
5. Проверить отсутствие лишнего скролла и layout shift.

## Формат ответа (compact)

```md
Checklist:

- responsive: pass/fail - ...
- a11y: pass/fail - ...
- i18n: pass/fail - ...
- states: pass/fail - ...
  Regression risks:
- ...
  Manual smoke:
- ...
  Checks run/skipped: run: ...; skipped: ...
```
