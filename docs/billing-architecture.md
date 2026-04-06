# Архитектура биллинга — Единая модель подписки

## Обзор

Gridix использует **единую модель подписки**, в которой проекты клиента группируются по интервалу выставления счетов в общие подписки Stripe. Вместо создания отдельной подписки Stripe для каждого проекта все проекты с одинаковым циклом выставления счетов (например, все ежемесячные или все ежегодные) используют одну подписку Stripe.

Это сокращает количество подписок, объединяет платежи в меньшее количество счетов и поддерживает добавление модулей в будущем.

## Ключевые концепции

### Группировка по интервалу выставления счетов

Проекты группируются по интервалу выставления счетов:

- **Ежемесячно** (1, 3, 6 месяцев) — `billing_interval = „month“`, `billing_interval_count = 1|3|6`
- **Ежегодный** (12, 24, 36 месяцев) — `billing_interval = „year“`, `billing_interval_count = 1|2|3`

У пользователя может быть не более **одной активной подписки Stripe на каждый интервал**. Добавление проекта с тем же интервалом к существующей подписке добавляет новую позицию (с пропорциональным распределением), а не создает новую подписку.

### Двойная запись / Совместимость с устаревшими таблицами

Существующие подписки, созданные до внедрения унифицированной модели, продолжают работать в таблицах `user_subscriptions` и `stripe_subscription_items`. Новые подписки записываются в обе:

1. **Новые таблицы**: `customer_subscriptions` + `subscription_line_items`
2. **Устаревшие таблицы**: `user_subscriptions` + `stripe_subscription_items`

Это обеспечивает обратную совместимость. Фронтенд считывает данные из обоих источников.

---

## Схема базы данных

### `customer_subscriptions`

Одна строка на пользователя за один интервал биллинга. Связь с подпиской Stripe.

| Колонка                  | Тип         | Описание                                                  |
| ------------------------ | ----------- | --------------------------------------------------------- |
| `id`                     | uuid        | Первичный ключ                                            |
| `user_id`                | uuid        | Внешний ключ к `auth.users`                               |
| `stripe_subscription_id` | text        | Идентификатор подписки Stripe (null для оплаты по счетам) |
| `stripe_customer_id`     | text        | Идентификатор клиента Stripe                              |
| `billing_interval`       | text        | `„month“` или `„year“`                                    |
| `billing_interval_count` | int         | 1, 3, 6 для месяцев; 1, 2, 3 для лет                      |
| `status`                 | text        | `pending`, `active`, `trialing`, `cancelled`              |
| `current_period_start`   | timestamptz | Начало текущего расчетного периода                        |
| `current_period_end`     | timestamptz | Окончание текущего расчетного периода                     |
| `cancel_at_period_end`   | boolean     | Ожидается ли отмена                                       |

**Уникальное ограничение**: `(user_id, billing_interval, billing_interval_count)`

### `subscription_line_items`

Одна строка на каждый проект (или модуль) в подписке клиента.

| Колонка                       | Тип     | Описание                                     |
| ----------------------------- | ------- | -------------------------------------------- |
| `id`                          | uuid    | Первичный ключ                               |
| `customer_subscription_id`    | uuid    | Внешний ключ в `customer_subscriptions`      |
| `stripe_subscription_item_id` | text    | Идентификатор элемента подписки Stripe       |
| `item_type`                   | text    | `„project“` или `„module“`                   |
| `project_id`                  | uuid    | Внешний ключ в `projects` (null для модулей) |
| `module_slug`                 | text    | Идентификатор модуля (null для проектов)     |
| `plan_id`                     | uuid    | Внешний ключ к `subscription_plans`          |
| `plan_slug`                   | text    | Слаг плана на момент создания                |
| `effective_price`             | numeric | Цена после скидки                            |
| `discount_percentage`         | numeric | Примененная скидка                           |
| `status`                      | text    | `pending`, `active`, `cancelled`             |

**Уникальное ограничение**: `(customer_subscription_id, project_id)`

### `subscription_modules` (для будущего использования)

Каталог дополнительных модулей.

| Колонка             | Тип      | Описание                      |
| ------------------- | -------- | ----------------------------- |
| `id`                | uuid     | Первичный ключ                |
| `slug`              | текст    | Уникальный идентификатор      |
| `name`              | текст    | Отображаемое имя              |
| `stripe_product_id` | текст    | Идентификатор продукта Stripe |
| `monthly_price`     | числовой | Цена за месяц                 |
| `is_active`         | boolean  | Доступен ли модуль            |
| `features`          | jsonb    | Список функций                |

---

## Настройка Stripe

### Структура продуктов и цен

Для каждого тарифного плана (Basic, Pro) в Stripe должно быть:

- **Продукт**: `Gridix Basic`, `Gridix Pro`
- **Цены**: одна периодическая цена на каждый интервал выставления счетов:
  - Ежемесячно: `$X/месяц` (interval=month, interval_count=1)
  - Ежеквартально: `$X/3 месяца` (interval=month, interval_count=3)
  - Раз в полгода: `$X/6 месяцев` (interval=month, interval_count=6)
  - Ежегодно: `$X/год` (интервал=год, количество_интервалов=1)
  - 2 года: `$X/2 года` (интервал=год, количество_интервалов=2)
  - 3 года: `$X/3 года` (интервал=год, количество_интервалов=3)

В таблице `subscription_plans` должны быть заполнены столбцы `stripe_product_id` и `stripe_price_id`.

### Конвенция метаданных

Все новые подписки включают `model_version: «unified_v1»` в метаданных Stripe. Это позволяет обработчику веб-хуков направлять события к правильной логике обработки.

**Метаданные подписки:**

```json
{
  «user_id»: «uuid»,
  «plan_id»: «uuid»,
  «plan_slug»: «pro»,
  «project_ids»: «id1,id2,id3»,
  «project_count»: «3»,
  «duration_months»: «12»,
  «model_version»: «unified_v1»,
  «source»: «gridix_checkout»
}
```

**Метаданные элемента подписки:**

```json
{
  «user_id»: «uuid»,
  «project_id»: «uuid»,
  «project_name»: «Мой проект»,
  «model_version»: «unified_v1»,
  «source»: «gridix_add_projects»
}
```

---

## Потоки платежей

### Оплата картой — новая подписка

1. Фронтенд вызывает `stripe-billing` с параметром `action: create-checkout-session`
2. Бэкенд проверяет `customer_subscriptions` на наличие существующей подписки с таким же интервалом
3. **Нет** → создается сессия Stripe Checkout, записи помечаются как «в ожидании» как в новой, так и в старой таблице
4. Пользователь завершает оплату в Stripe
5. Срабатывает веб-хук `checkout.session.completed`
6. Веб-хук разбивает количество на позиции по проектам, создает сопоставления
7. Обновляет `customer_subscriptions` и `subscription_line_items` до активного статуса
8. Обновляет `projects.subscription_status`

### Оплата картой — добавление к существующей подписке

1. Фронтенд вызывает `stripe-billing` с `action: create-checkout-session`
2. Бэкенд находит существующие записи `customer_subscriptions` с таким же интервалом
3. Внутренне перенаправляется к логике `add-projects`
4. Добавляет позиции подписки Stripe с пропорциональным расчетом
5. Возвращает `{ success: true, added: true }` — без перенаправления
6. Фронтенд показывает уведомление об успешном выполнении и обновляет страницу

### Оплата счета

1. Фронтенд вызывает `subscription-management` с `action: request-invoice`
2. Создает записи в статусе «ожидание» как в новой, так и в старой таблице
3. Генерирует счет в формате PDF с помощью функции `generate-invoice`
4. Администратор подтверждает оплату с помощью действия `confirm-payment`
5. Активирует подписку в обеих таблицах

---

## Функции Edge

| Функция                   | Назначение                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `stripe-billing`          | Сеансы оформления заказа, добавление/удаление проектов, изменения тарифных планов, запросы клиентов по подписке |
| `stripe-webhooks`         | Обработка событий веб-хуков Stripe, синхронизация состояния подписки                                            |
| `subscription-management` | Тарифные планы, счета, подписки на проекты, подтверждение оплаты                                                |
| `generate-invoice`        | Создание счетов в формате PDF (для одного проекта и объединенных нескольких проектов)                           |

---

## Как добавить новый модуль

### 1. База данных

Вставьте строку в таблицу `subscription_modules`:

```sql
INSERT INTO subscription_modules (slug, name, description, monthly_price, is_active, features)
VALUES („analytics“, „Advanced Analytics“, „Detailed project analytics“, 29.99, true, „[«charts», „reports“, «export»]“);
```

### 2. Stripe

Создайте продукт Stripe и установите ежемесячную цену:

1. Перейдите в панель управления Stripe → Продукты → Добавить продукт
2. Название: `Gridix Module: Advanced Analytics`
3. Цена: `$29.99/month` (повторяющаяся, ежемесячная)
4. Скопируйте ID продукта и обновите `subscription_modules.stripe_product_id`

### 3. Функция Edge — `stripe-billing`

Добавьте два новых действия в `stripe-billing/index.ts`:

```typescript
case «add-module»:
  return await handleAddModule(req, user.id, body);
case «remove-module»:
  return await handleRemoveModule(req, user.id, body);
```

**`handleAddModule`** должна:

1. Найти `customer_subscriptions` пользователя (для модулей предпочтительна ежемесячная периодичность)
2. Найти модуль в `subscription_modules` по слэгу
3. Создать элемент подписки Stripe с ценой модуля
4. Вставить в `subscription_line_items` с `item_type = „module“` и `module_slug`

**`handleRemoveModule`** должен:

1. Найти строку `subscription_line_items` по module_slug
2. Удалить элемент подписки Stripe
3. Обновить статус `subscription_line_items` на cancelled

### 4. Фронтенд

1. Добавьте функции API в `subscriptionApi.ts`:

   ```typescript
   export const addModule = async (moduleSlug: string) => { ... };
   export const removeModule = async (moduleSlug: string) => { ... };
   ```

2. Создайте компонент интерфейса каталога модулей, который считывает данные из `subscription_modules`
3. Добавьте управление модулями на страницу настроек подписки

### 5. Контроль доступа

Проверьте доступ к модулю в коде вашей функции:

```typescript
// Запрос к `subscription_line_items` для активного модуля
const { data } = await supabase
  .from(„subscription_line_items“)
  .select(„id“)
  .eq(„item_type“, „module“)
  .eq(„module_slug“, „analytics“)
  .eq(„status“, „active“)
  .eq(„project_id“, projectId)
  .maybeSingle();

const hasModule = Boolean(data);
```

---

## Обработка веб-хуков

Функция `stripe-webhooks` обрабатывает следующие события:

| Событие                         | Действие                                                            |
| ------------------------------- | ------------------------------------------------------------------- |
| `checkout.session.completed`    | Активировать подписки, разделить позиции, создать сопоставления     |
| `invoice.paid`                  | Обновить статус подписки на «active», синхронизировать даты периода |
| `invoice.payment_failed`        | Пометить подписки как просроченные                                  |
| `customer.subscription.updated` | Синхронизация изменений статуса и периода                           |
| `customer.subscription.deleted` | Отмена всех позиций и подписки клиента                              |

Обработчик веб-хука обновляет как унифицированные таблицы (`customer_subscriptions`, `subscription_line_items`), так и устаревшие таблицы (`user_subscriptions`, `stripe_subscription_items`) для обеспечения обратной совместимости.

---

## Архитектура интерфейса

### Основные файлы

| Файл                                                                | Назначение                                          |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| `entities/subscription/api/subscriptionApi.ts`                      | Функции API для всех операций по выставлению счетов |
| `entities/subscription/queries/useSubscription.ts`                  | Типы и основной хук подписки                        |
| `features/admin-subscription/model/useSubscriptionTabController.ts` | Контроллер процесса оформления заказа               |
| `features/subscription-checkout/ui/CheckoutModal.tsx`               | Модальное окно оформления заказа из 3 шагов         |

### Типы

- `CustomerSubscription` — унифицированная запись подписки
- `SubscriptionLineItem` — позиция проекта/модуля
- `CustomerSubscriptionResponse` / `SubscriptionLineItemResponse` — формы ответов API

### Процесс оформления заказа

1. **Выбор проектов** → выбор тарифного плана и проектов
2. **Информация о плательщике** → данные для выставления счета физическому лицу или компании
3. **Способ оплаты** → карта (Stripe) или счет-фактура

При оплате картой, если для выбранного периода существует соответствующая запись `customer_subscription`, проекты добавляются напрямую (без перенаправления на Stripe Checkout). Ответ содержит `added: true`.
