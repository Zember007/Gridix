---
name: stripe-billing-and-trial-integration
overview: Проверка ограничений тарифов и триггеров подписки в Supabase (prod `ebonmrtmfopohayxfvdy`), затем внедрение Stripe Subscriptions в USD с оплатой за проект и multi-project checkout, с вебхуками для продления/истечения, не ломая текущий invoice (PDF/банковский перевод) flow.
todos:
  - id: limits-no-subscription
    content: Собрать и сверить ограничения basic/pro (по переводам и по текущим проверкам доступа в коде).
    status: pending
  - id: supabase-triggers-trial-expire
    content: Через Supabase MCP проверить функции/триггеры trial pro на 14 дней и ежедневную экспирацию подписок, убедиться, что они согласованы с фронтом.
    status: pending
  - id: stripe-model-design-usd
    content: Спроектировать модель Stripe Subscriptions в USD для одного и нескольких проектов, с Products/Prices и line items.
    status: pending
  - id: edge-functions-stripe-checkout
    content: Спроектировать/расширить edge-функции Supabase для создания Stripe Checkout/Portal сессий и хранения метаданных.
    status: pending
  - id: stripe-webhooks-sync
    content: Спроектировать edge-функцию вебхуков Stripe и маппинг событий на таблицы user_subscriptions/projects/subscription_history.
    status: pending
  - id: e2e-tests-trial-and-stripe
    content: Определить E2E сценарии (trial, оплата одного/нескольких проектов, продление, фейлы) и убедиться, что текущий invoice-флоу не ломается.
    status: pending
  - id: stripe-mapping-and-idempotency
    content: Добавить в Supabase таблицы stripe_subscription_items и processed_stripe_events (миграции, индексы) для надежного маппинга item→project и идемпотентности вебхуков.
    status: pending
  - id: subscription-items-management
    content: Реализовать endpoints add/remove/change-plan для управления проектами внутри одной Stripe Subscription аккаунта (без создания новой Subscription).
    status: pending
  - id: expire-buffer-card
    content: Добавить 2h буфер в check_and_expire_subscriptions для payment_method='card' чтобы исключить гонки с вебхуками/платежами.
    status: pending
  - id: stripe-feature-flag
    content: Ввести STRIPE_ENABLED флаг (edge+frontend) для быстрого отката Stripe без поломки invoice flow.
    status: pending
isProject: false
---

### 0. Окружения и инварианты (фиксируем до работ)

- **Источник данных для проверки**: Supabase **prod** проект `ebonmrtmfopohayxfvdy` (см. `supabase/config.toml`, `apps/main/.env`).
- **Dev проект**: `cednalyslckqlqctuzfs` будет обновлён из prod после утверждения плана; все рискованные изменения (DDL/edge function деплой/Stripe webhook) сначала делаем в dev.
- **Валюта**: **USD** в Stripe и в UI (в коде уже используется `$` и текст `USD / month`).
- **Совместимость**: текущий invoice flow (`request-invoice` → `pending_payment` → супер-админ `confirm-payment`) должен продолжать работать без изменений и параллельно с Stripe.

### 1. Анализ текущих ограничений и UI при отсутствии подписки

- **Собрать матрицу фич по тарифам**: на основе ключей из `[apps/main/src/entities/subscription/model/adminPricingContent.ts](apps/main/src/entities/subscription/model/adminPricingContent.ts)` и соответствующих переводов в `[apps/main/src/locales/*/admin.json](apps/main/src/locales/en/admin.json)` выписать, какие именно возможности есть у `basic` и `pro`.
- **Найти все места проверки подписки/ограничений**: пройтись по использованию `subscription_status`, `subscription_expires_at` и `useSubscriptionStatus` в файлах вроде `[apps/main/src/components/project-selector/ProjectApartmentSelector.tsx](apps/main/src/components/project-selector/ProjectApartmentSelector.tsx)`, `[apps/main/src/pages/DomainProjectPage.tsx](apps/main/src/pages/DomainProjectPage.tsx)`, `Partner*Section.tsx` и др., чтобы понять, какие реальные блокировки применяются при отсутствии подписки.
- **Сопоставить фактические ограничения с текстом тарифов**: сверить, что то, что мы обещаем в плане (через `planContent.basic/pro.features.`\*), совпадает с тем, что реально включено/выключено в UI и доступе к данным при отсутствии или окончании подписки; наметить, где при внедрении Stripe нужно будет дополнить/уточнить проверки.
- **Отдельно проверить расхождения статусов**: в коде есть разные трактовки `pending_payment` (где-то считается допустимым для “не истёкло”, а где-то блокирует доступ). Зафиксировать ожидаемую бизнес-логику (для владельца/для публичного домена) и привести к единому правилу.

### 2. Проверка триггеров и функций в Supabase (trial и ежедневная экспирация)

- **Идентифицировать объекты БД** (prod `ebonmrtmfopohayxfvdy`): с помощью Supabase MCP (`list_tables` + `execute_sql`) подтвердить таблицы `projects`, `user_subscriptions`, `subscription_plans`, `subscription_history`, а также существование функции `check_and_expire_subscriptions` (тип виден в `packages/types/src/database.ts`).
- **Проверить edge-функции управления подпиской**: через `list_edge_functions` и `get_edge_function` прочитать реализацию `subscription-management` (и `generate-invoice`), чтобы понять текущие действия:
  - создание `pending_payment` подписок для invoice,
  - подтверждение платежа (`confirm-payment`),
  - где/как ставится trial (если это не SQL trigger).
- **Проверить логику 14-дневного trial pro**:
  - `execute_sql` (SELECT) найти:
    - триггеры на `projects` (AFTER INSERT) и/или `user_subscriptions`,
    - функции-триггеры (в `pg_proc`) связанные с trial,
    - любые ограничения (unique index/constraint) на trial по `user_id`.
  - Проверить бизнес-правило: **trial pro 14 дней должен применяться только к первому созданному проекту аккаунта**:
    - сценарий A: первый проект → должен получить trial (`projects.subscription_status in ('trial','trialing')` или `user_subscriptions.status` trial) и `trial_ends_at = now()+14d`;
    - сценарий B: второй проект того же `user_id` → trial не создаётся.
- **Проверить ежедневную экспирацию подписок**:
  - Найти cron-задачу или background job, которая вызывает `check_and_expire_subscriptions`:
    - `SELECT * FROM cron.job ...` (если включён `pg_cron`);
    - альтернативно: Supabase Scheduled Functions / external scheduler (если cron не в БД) — тогда поиск в edge function/logs.
  - Проверить расписание: **1 раз в сутки**.
  - Проанализировать, как функция обновляет:
    - `user_subscriptions.status`, `current_period_end`, `invoice_paid_at`;
    - `projects.subscription_status` и `projects.subscription_expires_at`;
    - записи в `subscription_history`.
  - Снять несколько выборок (`SELECT`) для подписок, у которых `current_period_end < now()`, и убедиться, что статус корректно меняется на `expired` и проект блокируется так же, как сейчас ожидает фронт.

### 3. Дизайн интеграции со Stripe (USD, multi-project, рекуррентные подписки)

- **Определить Stripe-модель**:
  - Использовать полноценные **Stripe Subscriptions** как источник правды по оплате (рекуррентные списания в USD), а `user_subscriptions` в Supabase — как синхронизированный кэш и слой фич-флагов.
  - Для одного аккаунта/пользователя создавать **одного Stripe Customer**.
  - **Архитектурное решение (фиксируем)**: **1 Stripe Subscription на аккаунт** с единым `billing_cycle_anchor` (дата первой оплаты), а **1 SubscriptionItem на проект**.
    - Внутри одной Subscription допускается микс разных `price_id` (Basic/Pro), при этом billing day остаётся единым.
    - Добавление проекта в середине цикла должно использовать Stripe proration (Stripe выставляет инвойс за остаток периода).
  - **Надёжный маппинг item→project обязателен** (см. таблицу `stripe_subscription_items` ниже), иначе вебхуки будут хрупкими.
- **Моделирование тарифов в Stripe**:
  - Цены в Stripe должны быть в **USD**.
  - **Базовый вариант**: цены Basic/Pro — `interval=month` (monthly recurring).
  - **Про “duration 1/3/6/12” (сейчас есть в UI)**: выбрать одну стратегию, чтобы не конфликтовать с единым billing cycle:
    - оставить duration только для invoice flow; Stripe card = monthly без фиксированного срока, или
    - реализовать “коммитмент на N месяцев” через `Subscription Schedule`/`cancel_at` (при этом billing day остаётся единым, а скидки можно кодировать купонами).
- **API-флоу Checkout/Portal**:
  - На Supabase edge-функции (например, расширить `subscription-management` или создать новую `stripe-billing`) реализовать endpoint для создания Stripe Checkout Session / Customer Portal Session:
    - вход: массив `project_ids`, `plan_id`, `duration_months`, данные плательщика;
    - действия: проверка ограничений, подготовка line items, установка `metadata` (user_id, project_ids, plan_id, duration_months, environment, internal ids);
    - возврат: URL сессии Stripe.
  - В `CheckoutModal` добавить вариант "Оплата картой через Stripe" поверх текущего варианта с PDF-инвойсом, не ломая существующий flow `requestInvoice`.
  - **Флоу управления проектами внутри существующей подписки (без Checkout)**:
    - `stripe-billing/add-projects`: добавить 1..N проектов (создать SubscriptionItems, proration/invoice происходит автоматически).
    - `stripe-billing/remove-projects`: убрать проекты (удалить SubscriptionItems или пометить cancel на конец периода — по бизнес-правилу).
    - `stripe-billing/change-plan`: сменить Basic↔Pro на проекте (update SubscriptionItem price, proration).
- **Совместимость с текущими инвойсами**:
  - Сохранить существующий edge-flow `request-invoice` + PDF/банковский перевод:
    - не трогать текущий UI для выставления инвойсов;
    - в Supabase оставить `payment_method = 'invoice'` и логику супер-админа, подтверждающего оплату (`confirm-payment`).
  - Добавить новый тип `payment_method = 'card'` для транзакций из Stripe, чтобы история и ограничения работали единообразно.
  - **Feature flag отката**: `STRIPE_ENABLED` (edge env) + `VITE_STRIPE_ENABLED` (frontend) чтобы быстро выключить Stripe и оставить invoice flow.

### 4. Проектирование вебхуков Stripe и синхронизации статусов

- **Создать/расширить edge-функцию под вебхуки**:
  - В `supabase/functions` спроектировать функцию (например, `stripe-webhooks`), принимающую уведомления Stripe.
  - Подписаться как минимум на события: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
  - Реализовать проверку подписи Stripe (webhook signing secret) и маппинг `event.data.object` → внутренних действий.
- **Маппинг событий на нашу модель**:
  - При успешной оплате (Checkout Session completed / invoice.paid):
    - обеспечить идемпотентность: писать `stripe_event_id` в `processed_stripe_events`, при конфликте — выход;
    - сопоставить line items (SubscriptionItems) с проектами через `stripe_subscription_items`;
    - по metadata (user_id, project_ids, plan_id, duration_months) найти или создать строки в `user_subscriptions` для каждого проекта (или обновить существующие);
    - обновить `status` → `active`, `current_period_start`, `current_period_end`:
      - `current_period`\_\* берём из Stripe (`subscription.current_period_start/end`) как источник правды для рекуррентной модели;
    - обновить `projects.subscription_status` и `subscription_expires_at`;
    - записать запись в `subscription_history` с action `stripe_payment`.
  - При `invoice.payment_failed` или отмене подписки Stripe:
    - отметить `cancel_at_period_end` или `status = 'cancelled'` в `user_subscriptions`;
    - полагаться на `check_and_expire_subscriptions` (или дублировать проверку дат) для окончательного отключения доступа.
- **Согласование с существующими триггерами**:
  - Убедиться, что обновления из вебхуков не конфликтуют с ежедневной задачей `check_and_expire_subscriptions` (например, не создают гонки статусов).
  - Если нужно, договориться, что edge-функция при записи в `user_subscriptions` всегда обновляет поля так, как ожидает `check_and_expire_subscriptions`.

### 5. Проведение end-to-end сценариев (в том числе с trial pro)

- **Тест-кейсы для триала pro**:
  - Новый пользователь создаёт первый проект → триггер в Supabase создаёт trial pro на 14 дней для одного проекта и обновляет `projects.subscription_status`/`subscription_expires_at`.
  - Попытка получить trial для второго проекта в этом же аккаунте → в БД не создаётся новая trial-подписка; UI видит ограничения как для basic/без подписки.
- **Тест-кейсы Stripe (USD, один/несколько проектов)**:
  - Пользователь с trial-статусом оформляет платную подписку через Stripe на один проект → после вебхука:
    - статус проекта становится активным;
    - в `user_subscriptions` корректно стоит `status = 'active'`, `payment_method = 'card'`, даты периода.
  - Пользователь выбирает несколько проектов в `CheckoutModal` → edge-функция создаёт Stripe сессию с несколькими line items, оплата проходит, и вебхук создаёт/обновляет `user_subscriptions` для всех проектов с общим `invoice_number`/Stripe invoice id в `metadata`.
- **Regression-тесты текущего invoice-флоу**:
  - Проверить, что запрос инвойса через существующий UI всё ещё работает: создаётся запись `pending_payment`, супер-админ может сгенерировать PDF и подтвердить оплату.
  - Убедиться, что доступ/блокировки по подписке продолжают опираться на уже проверенные триггеры/функции и новые записи из Stripe не ломают текущую отчётность.

### 6. Валидация производительности и UX

- **Проверить скорость и UX CheckoutModal**:
  - Убедиться, что добавление Stripe-варианта не перегружает интерфейс: при выборе оплаты картой всё так же понятно, какие проекты и на какой план/срок оплачиваются.
  - Для мобильных сценариев (админ панель на телефоне) проверить удобство работы с несколькими проектами и переходами в Stripe.
- **Минимизация задержек**:
  - Проверить, что мы не блокируем UI ожиданием вебхука: после редиректа из Stripe показывать состояние "Оплата обрабатывается", а фактическую активацию доверять вебхуку и фоновому обновлению `projectSubscriptions`.

### 7. Supabase: новые таблицы для Stripe (миграции в dev, затем перенос)

- `**stripe_subscription_items`\*\* — маппинг Stripe subscription/item → проект (чтобы вебхук точно знал, какой проект активировать/продлить/отключить):

```sql
create table if not exists public.stripe_subscription_items (
  id uuid primary key default gen_random_uuid(),
  stripe_subscription_id text not null,
  stripe_subscription_item_id text not null unique,
  stripe_customer_id text not null,
  project_id uuid not null references public.projects(id),
  user_id uuid not null,
  plan_slug text not null, -- 'basic' | 'pro'
  status text not null,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);
```

- `**processed_stripe_events**` — идемпотентность вебхуков (Stripe может доставлять события повторно):

```sql
create table if not exists public.processed_stripe_events (
  stripe_event_id text primary key,
  processed_at timestamptz not null default now()
);
```

### 8. Экспирация и буфер от гонок cron ↔ webhooks

- Обновить `check_and_expire_subscriptions` (или обёртку, которая её вызывает), добавив **2 часа буфера** для `payment_method='card'`:
  - если `current_period_end > now() - interval '2 hours'`, запись **не трогаем** (уменьшаем риск, что cron “истёк” раньше вебхука `invoice.paid`/`subscription.updated`).
  - затем — обычная логика истечения/блокировок.
