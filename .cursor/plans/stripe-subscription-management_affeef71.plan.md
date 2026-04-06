---
name: stripe-subscription-management
overview: Исправить поведение Stripe-биллинга так, чтобы повторные покупки проектов в том же периоде шли в одну подписку без нового Checkout, и добавить в админку собственный UI для отмены подписки по проекту и смены карты оплаты.
todos:
  - id: fix-legacy-checkout-reuse
    content: Расширить findExistingCustomerSubscription и связанный код в stripe-billing так, чтобы повторные покупки для того же периода всегда добавляли проекты в уже существующую Stripe-подписку (включая legacy-подписки).
    status: completed
  - id: frontend-cancel-flow
    content: Добавить на фронтенде API и UI-действие для отмены подписки по конкретному проекту через remove-projects, с обновлением user_subscriptions и customer_subscriptions.
    status: completed
  - id: frontend-change-card-flow
    content: Реализовать модалку смены карты оплаты на базе Setup Intent (create-setup-intent + set-default-payment-method) и подключить её к странице подписки.
    status: completed
  - id: stripe-invoices-ui
    content: "Опционально: добавить раздел истории инвойсов Stripe в админке, используя fetchStripeInvoices."
    status: completed
isProject: false
---

# План: единая Stripe‑подписка, отмена и смена карты

## Цели

- **Единая подписка на период**: при оплате новых проектов с тем же периодом (месяц/год/2–3 года) больше не создаём новые подписки Stripe и не открываем Checkout, а добавляем проекты в уже существующую подписку.
- **Управление из нашего сервиса**: в админке появляются действия для **отмены подписки по конкретному проекту** (с сохранением доступа до конца оплаченного периода) и **смены карты оплаты** через наш UI на основе Setup Intent.

## EXACT APPLY FILE LIST

- `supabase/functions/stripe-billing/index.ts`
- `supabase/functions/subscription-management/index.ts` (только при необходимости мелких правок формата ответа)
- `apps/main/package.json`
- `apps/main/src/vite-env.d.ts`
- `apps/main/src/entities/subscription/api/subscriptionApi.ts`
- `apps/main/src/entities/subscription/queries/useSubscription.ts` (расширение типов и данных из unified‑таблиц по мере необходимости)
- `apps/main/src/features/admin-subscription/model/useSubscriptionTabController.ts`
- `apps/main/src/features/admin-subscription/ui/SubscriptionTab.tsx`
- `apps/main/src/entities/subscription/ui/ProjectSubscriptionsList.tsx`
- `apps/main/src/features/admin-subscription/ui/ChangePaymentMethodModal.tsx` (новый файл)
- `apps/main/src/features/admin-subscription/ui/StripeInvoicesSection.tsx` (опционально, если захотите сразу отрисовать историю инвойсов Stripe)

## 1. Backend: корректное определение существующей подписки

- **Расширить `findExistingCustomerSubscription`** в `stripe-billing/index.ts`:
  - Сначала оставить текущую логику: поиск в `customer_subscriptions` по `(user_id, billing_interval, billing_interval_count, status in ['active','trialing'])`.
  - Если запись не найдена, **добавить fallback для legacy**:
    - Выбрать из `user_subscriptions` все активные карточные подписки пользователя (`status in ('active','trialing')`, `payment_method = 'card'`, с полями `stripe_subscription_id`, `duration_months`, `current_period_end`, `cancel_at_period_end`).
    - Для каждой строки локально пересчитать `(interval, intervalCount)` через уже существующую функцию `durationToBillingInterval(duration_months)` и отфильтровать только те, для которых пара совпадает с аргументами `billingInterval`/`billingIntervalCount`.
    - Для первой подходящей записи взять `stripe_subscription_id` и через `fetchSubscription` получить из Stripe `customer`, `current_period_start`, `current_period_end`.
    - Выполнить `upsert` в `customer_subscriptions` (как уже делается в `handleAddProjects`): создать/обновить строку с этим `stripe_subscription_id`, `stripe_customer_id`, нужным интервалом и статусом (`active`/`trialing`), датами периода.
    - Вернуть объект `{ id, stripe_subscription_id, stripe_customer_id }` этой строки; при ошибках или отсутствии подходящих строк — вернуть `null`.
- **Использование fallback‑логики**:
  - `handleCreateCheckoutSession` и `handleAddProjects` уже вызывают `findExistingCustomerSubscription`, так что после доработки:
    - Для legacy‑подписок (только в `user_subscriptions`/`stripe_subscription_items`) при повторной покупке проектов с тем же периодом `findExistingCustomerSubscription` начнёт возвращать `existing`.
    - `handleCreateCheckoutSession` будет корректно перенаправлять такие кейсы в `handleAddProjects` и возвращать `{ success: true, added: true }` **без URL Stripe Checkout**.
    - `handleAddProjects` будет добавлять новые `subscription_items` в уже существующую Stripe‑подписку с пропорциональными начислениями и делать dual‑write в `user_subscriptions` и `subscription_line_items`.

_Результат_: при добавлении проекта в уже оплаченный период (месяц/год/2–3 года) пользователь **остаётся в нашей админке**, а новые проекты докупаются в существующую подписку, как описано в `billing-architecture.md` (`create-checkout-session` → `add-projects`, без редиректа).

## 2. Backend: отмена по проекту и смена карты

- **Отмена по одному проекту** (используем уже реализованный `handleRemoveProjects`):
  - Ничего принципиально не менять в `handleRemoveProjects`: он уже
    - находит по `stripe_subscription_items` все элементы по `project_ids` и пользователю,
    - удаляет соответствующие `subscription_items` в Stripe с `proration_behavior: 'create_prorations'`,
    - проставляет `status = 'cancelled'`, `cancel_at_period_end = true` и `cancelled_at` в `user_subscriptions` и `subscription_line_items`,
    - при отсутствии активных позиций на `customer_subscriptions` включает `cancel_at_period_end` для всей Stripe‑подписки.
  - В рамках данного этапа используем эту логику как есть (отмена с пропорциональной корректировкой в Stripe, но в UI считаем доступ активным до `current_period_end` при `cancel_at_period_end = true`).
- **Смена карты оплаты** (уже реализованы обработчики):
  - Используем существующие `handleCreateSetupIntent` и `handleSetDefaultPaymentMethod`:
    - `create-setup-intent` создаёт SetupIntent с `usage: 'off_session'` и возвращает `client_secret`.
    - `set-default-payment-method`:
      - `attach`-ит `payment_method` к customer,
      - выставляет его как `invoice_settings.default_payment_method` у customer,
      - обновляет `default_payment_method` для всех активных записей в `customer_subscriptions` (Stripe‑подписок) этого пользователя.

_Результат_: одна Stripe‑подписка на интервал может быть отменена **по конкретным project_ids** через `remove-projects`, а смена карты делается один раз на уровне customer и применяется ко всем активным подпискам.

## 3. Frontend API: новые методы для отмены и смены карты

- В `subscriptionApi.ts`:
  - **Добавить функцию отмены по проекту**:
    - `cancelStripeSubscriptionForProject(projectId: string)`: обёртка над `stripe-billing` с `action: 'remove-projects'` и `project_ids: [projectId]`, возвращающая `{ success: boolean }`.
  - (Опционально) `cancelStripeSubscriptionForProjects(projectIds: string[])` для массовой отмены, если понадобится в будущем.
  - **Оставить уже добавленные** `createSetupIntent` и `setDefaultPaymentMethod` как основной API для смены карты.
  - При необходимости слегка расширить типы/результаты (`added?: boolean` у `createStripeCheckoutSession` уже есть и используется).

_Результат_: UI сможет вызывать точечную отмену проекта и запускать flow смены карты без прямых обращений к Supabase Functions.

## 4. Frontend: Stripe JS и модалка смены карты

- **Зависимости** в `apps/main/package.json`:
  - Добавить `@stripe/stripe-js` и `@stripe/react-stripe-js` в зависимости `@gridix/main`.
- **Env и типы**:
  - В `.env` для `apps/main` договориться о ключе, например `VITE_STRIPE_PUBLISHABLE_KEY` (значение вы заполните сами).
  - В `vite-env.d.ts` добавить поле `readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;`.
- **Создать модалку смены карты** `ChangePaymentMethodModal.tsx` в `features/admin-subscription/ui`:
  - Использовать `loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!)` и `Elements` из `@stripe/react-stripe-js`.
  - При открытии модалки вызывать `createSetupIntent()` и передавать `client_secret` в `Elements`.
  - Внутри рендера использовать `PaymentElement` или `CardElement` + кнопку «Сохранить карту».
  - При сабмите вызывать `stripe.confirmSetup({ elements, clientSecret, confirmParams: { return_url: window.location.href } })` **в режиме без редиректа** (через `redirect: 'if_required'`), считывать `setupIntent.payment_method` и затем вызывать `setDefaultPaymentMethod(paymentMethodId)`.
  - Показывать `toast`‑уведомления об успехе/ошибке и закрывать модалку при успехе.

_Результат_: администратор может сменить карту, не уходя на Stripe портал; карта становится дефолтной для всех активных подписок.

## 5. Frontend: отмена по проекту и интеграция в SubscriptionTab

- **Расширить типы и контроллер**:
  - В `useSubscription.ts` при необходимости добавить состояние для unified‑подписок из `customer_subscriptions`, которые уже возвращает `subscription-management` в `handleGetProjectSubscriptions` (пока можно ограничиться только использованием `user_subscriptions` для принятия решения об активности проекта).
  - В `useSubscriptionTabController.ts`:
    - Добавить состояние `isChangeCardModalOpen` и (опционально) projectId, для которого была нажата смена карты (на случай, если в будущем захотим показывать контекст).
    - Реализовать `handleCancelSubscriptionForProject(projectId: string)`:
      - Проверять, что у проекта есть активная карточная подписка (по `project.user_subscriptions[0]`).
      - Показывать `confirm`/диалог, затем вызывать `cancelStripeSubscriptionForProject(projectId)`.
      - При успехе показывать `toast.success` и вызывать `refreshProjectSubscriptions()`.
    - Реализовать `handleOpenChangeCard()` (глобальный или по проекту): просто открывать модалку смены карты.
    - Вернуть эти обработчики и флаг `isChangeCardModalOpen` из хука.
- **Интеграция в `SubscriptionTab.tsx`**:
  - Передать в `ProjectSubscriptionsList` новые колбэки: `onCancelProject`, `onChangeCard`.
  - Подключить `ChangePaymentMethodModal` (новый компонент):
    - Открывать его при `isChangeCardModalOpen`.
    - В пропсы передавать `onClose`, `onSuccess` (для обновления подписок при необходимости).

_Результат_: на вкладке подписки появятся реальные кнопки «Отменить подписку» (по проекту) и «Изменить карту», работающие через новые backend‑методы.

## 6. Frontend: кнопки в `ProjectSubscriptionsList`

- В `ProjectSubscriptionsList.tsx`:
  - Расширить `ProjectSubscriptionsListProps`:
    - `onCancelProject?: (projectId: string) => void;`
    - `onChangeCard?: () => void;` (или `onChangeCard?: (projectId: string) => void;`, если захотим сделать привязку по проекту).
  - В блоке действий (правый столбец карточки проекта):
    - Для активных карточных подписок (`isActive && isCardPayment`) добавить:
      - Кнопку «Изменить карту» (иконка `CreditCard`), вызывающую `onChangeCard?.()`.
      - Кнопку «Отменить» (иконка `AlertTriangle` или `X`), вызывающую `onCancelProject?.(project.id)`.
    - Существующие кнопки «Изменить тариф» и «Продлить/Активировать» сохранить, используя уже готовый `onOpenInvoice`.

_Результат_: пользователь явно видит действия «Изменить карту» и «Отменить подписку» рядом с каждым активным проектом с оплатой картой.

## 7. (Опционально) Раздел истории инвойсов Stripe

- Добавить компонент `StripeInvoicesSection.tsx` в `features/admin-subscription/ui`:
  - Использовать `fetchStripeInvoices()` из `subscriptionApi.ts` для загрузки последних N инвойсов.
  - Отображать дату, сумму, валюту, статус и ссылку `hosted_invoice_url`/`invoice_pdf`.
- В `SubscriptionTab.tsx` отрисовать новый раздел (под историей заказов) с заголовком вроде «Stripe инвойсы».

_Результат_: администратор видит историю счетов именно из Stripe, как вы описали («видим инвойсы от Stripe через наш сервис»).

## 8. Проверки и ручная валидация

- **Технические проверки**:
  - Запустить `pnpm --filter @gridix/main typecheck`.
  - При изменениях только в TS/React можно ограничиться `typecheck`; линтер по желанию — `pnpm --filter @gridix/main lint`.
- **Ручной сценарий 1 — новая подписка**:
  - Оплатить первый проект любым периодом через карту → убедиться, что создаётся одна Stripe‑подписка и `customer_subscriptions` содержит одну строку.
- **Ручной сценарий 2 — добавление проекта в середине периода**:
  - Для того же пользователя и периода добавить второй проект через Checkout в админке.
  - Проверить, что **нет редиректа на Stripe Checkout**, в ответе `create-checkout-session` приходит `{ success: true, added: true }`, а в Stripe‑подписке появился новый `subscription_item` с нужной пропорцией.
- **Ручной сценарий 3 — отмена проекта**:
  - Нажать «Отменить подписку» на конкретном проекте.
  - Убедиться, что доступ в приложении остаётся до `current_period_end` (через UI), но в Stripe следующий инвойс учитывает удаление проекта.
- **Ручной сценарий 4 — смена карты**:
  - Открыть модалку смены карты, ввести новую карту, пройти 3DS при необходимости.
  - Проверить, что новые списания по любому связанному проекту идут с новой карты.

_После вашего подтверждения (`APPLY`) можно будет по этому плану внести правки в указанные файлы, прогнать проверки и описать результат._
