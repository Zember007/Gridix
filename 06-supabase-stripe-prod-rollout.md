# Supabase + Stripe: безопасный rollout в прод

Эта инструкция описывает, как выкатить текущую billing-архитектуру в прод без поломок.

## 1) Pre-flight перед релизом

- Зафиксируй окно релиза (без параллельных изменений в billing).
- Сделай backup прод-базы (обязательно).
- Подготовь тестового прод-пользователя для smoke test.

## 2) Проверка прод-схемы Supabase

Проверь наличие ключевых таблиц:

- `subscription_plans`
- `subscription_discounts`
- `user_subscriptions`
- `stripe_subscription_items`
- `processed_stripe_events`
- `projects`
- `user_profiles`

Проверь, что есть рабочая идемпотентность webhook-ивентов (claim/processed/failed), если она реализована через RPC/SQL функции.

## 3) Настройка Stripe в Live-режиме

Создай/проверь в **Stripe Live**:

- продукты для каждого тарифа (`Basic`, `Pro`);
- recurring prices для периодов: `1`, `3`, `6`, `12`, `24`, `36` месяцев;
- Billing Portal configuration.

Важно:

- в `subscription_plans` должны быть корректные:
  - `stripe_product_id` (обязательно),
  - `stripe_price_id` для 1-месячной цены (fallback и совместимость).
- в `subscription_discounts` должны быть все необходимые длительности, которые показываются на фронте.

## 4) Env/secrets в Supabase (prod project)

Проверь переменные окружения:

- `STRIPE_SECRET_KEY` (live secret key)
- `STRIPE_WEBHOOK_SECRET` (секрет live webhook endpoint)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- флаги включения Stripe (если используются в проекте)

## 5) Stripe Webhook endpoint

Добавь endpoint:

- `https://<SUPABASE_PROJECT_REF>.functions.supabase.co/stripe-webhooks`

Подпиши события:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `invoice.payment_action_required`
- `invoice.finalized`
- `customer.subscription.updated`
- `customer.subscription.deleted`

После создания endpoint обнови `STRIPE_WEBHOOK_SECRET` в прод-Supabase.

## 6) Деплой Edge Functions

Из корня проекта:

```bash
supabase functions deploy stripe-billing
supabase functions deploy stripe-webhooks
supabase functions deploy subscription-management
```

Если функция не менялась в релизе, можно пропустить, но безопаснее деплоить весь billing-контур.

## 7) Проверка данных тарифов (prod SQL)

Проверь связку тарифов:

```sql
select id, slug, name, stripe_product_id, stripe_price_id, is_active
from public.subscription_plans
order by name;
```

Проверь скидки:

```sql
select duration_months, discount_percentage, is_active
from public.subscription_discounts
order by duration_months;
```

## 8) Smoke test (обязательно)

На тестовом прод-аккаунте:

1. Оформи подписку на 1 месяц (card).
2. Оформи подписку на 3 месяца (card).
3. Выполни `change plan` для активной card-подписки.
4. Убедись, что:
   - webhook отработал без ошибок;
   - обновились `user_subscriptions` и `projects.subscription_status`;
   - событие попало в `processed_stripe_events`.

## 9) Наблюдение после релиза (30-60 минут)

- Мониторь ошибки edge functions (`stripe-webhooks`, `stripe-billing`, `subscription-management`).
- Проверь отсутствие повторной обработки одних и тех же Stripe event IDs.
- Проверь, что новые платежи и смена плана проходят стабильно.

## 10) Rollback plan

Если проблема обнаружена:

1. Останови трафик на проблемный сценарий (временно через UI toggle/feature flag, если есть).
2. Откати только проблемную функцию:
   - сначала `stripe-webhooks`, если проблема в синке;
   - `stripe-billing`, если проблема в checkout/change-plan.
3. Повтори smoke test на минимальном сценарии.

## 11) Что не делать

- Не удаляй `processed_stripe_events` и `stripe_subscription_items` — это рабочие системные таблицы Stripe-синхронизации.
- Не меняй `stripe_product_id`/`stripe_price_id` в `subscription_plans` без проверки цен в Stripe Live.
- Не выкатывай webhook без обновленного `STRIPE_WEBHOOK_SECRET`.

---

## Быстрый чеклист перед кнопкой "релиз"

- [ ] Backup прод-базы сделан
- [ ] Live products/prices в Stripe настроены
- [ ] Env/secrets в Supabase проверены
- [ ] Webhook endpoint и события в Stripe Live настроены
- [ ] Edge functions задеплоены
- [ ] Smoke test пройден
- [ ] Есть rollback-план и ответственный на мониторинг
