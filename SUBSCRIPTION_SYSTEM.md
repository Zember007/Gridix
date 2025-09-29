# Система подписок с LemonSqueezy

## Обзор

Реализована полная система подписок с интеграцией LemonSqueezy, включающая:

- 2 тарифных плана: Basic ($79) и Pro ($129)
- Система скидок по длительности подписки (до 50% за 3 года)
- 14-дневный бесплатный пробный период Pro без привязки карты
- Автоматическое управление подписками через вебхуки
- Защита контента по подписке

## Тарифные планы

### Basic Plan ($79/месяц)
- Конструктор планировок
- Базовые шаблоны
- Экспорт в PDF
- Email поддержка

### Pro Plan ($129/месяц)
- Все функции Basic
- Интеграция с CRM
- Персональный домен
- Расширенные шаблоны
- Приоритетная поддержка
- Аналитика

## Система скидок

- 1 месяц: 0% скидки
- 3 месяца: 5% скидки
- 6 месяцев: 10% скидки
- 12 месяцев: 20% скидки
- 24 месяца: 30% скидки
- 36 месяцев: 50% скидки

## Архитектура

### База данных

#### Таблицы:
- `subscription_plans` - тарифные планы
- `subscription_discounts` - скидки по длительности
- `user_subscriptions` - подписки пользователей
- `subscription_history` - история изменений

#### Триггеры:
- Автоматическое создание 14-дневного пробного периода Pro при регистрации
- Обновление timestamps при изменениях

### Edge Functions

#### `lemonsqueezy-webhook`
Обрабатывает вебхуки от LemonSqueezy:
- `subscription_created`
- `subscription_updated` 
- `subscription_cancelled`
- `subscription_resumed`
- `subscription_expired`
- `subscription_paused`
- `subscription_unpaused`

#### `subscription-management`
API для управления подписками:
- `GET /subscription` - получить подписку пользователя
- `GET /plans` - получить все планы с ценами
- `POST /create-checkout` - создать checkout сессию
- `POST /cancel-subscription` - отменить подписку

### React компоненты

#### Основные компоненты:
- `PricingPlans` - выбор тарифного плана
- `SubscriptionManager` - управление текущей подпиской
- `SubscriptionGuard` - защита контента по подписке

#### Хуки:
- `useSubscription` - работа с подписками
- `useSubscriptionGuard` - проверка доступа

#### Страницы:
- `/subscription` - управление подпиской
- `/subscription/success` - успешная оплата
- `/subscription/cancel` - отмена оплаты

## Использование

### Защита контента

```tsx
import { SubscriptionGuard } from './components/subscription';

// Защита по плану
<SubscriptionGuard requiredPlan="pro">
  <ProOnlyComponent />
</SubscriptionGuard>

// Защита по функции
<SubscriptionGuard requiredFeature="CRM integration">
  <CRMComponent />
</SubscriptionGuard>
```

### Проверка в коде

```tsx
import { useSubscription } from './hooks/useSubscription';

const { hasFeature, isPro, isActive } = useSubscription();

if (hasFeature('Custom domain')) {
  // Показать функцию
}

if (isPro()) {
  // Pro функции
}
```

### Создание checkout

```tsx
const { createCheckout } = useSubscription();

const handleUpgrade = async () => {
  try {
    const { checkoutUrl } = await createCheckout('pro', 12);
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Failed to create checkout:', error);
  }
};
```

## Настройка

### 1. LemonSqueezy

1. Создайте аккаунт на LemonSqueezy
2. Настройте продукты с вариантами для разных периодов
3. Получите API ключи и ID продуктов
4. Настройте вебхуки

### 2. Переменные окружения

```bash
# LemonSqueezy
LEMONSQUEEZY_API_KEY=lmsq_sk_...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=wh_...
LEMONSQUEEZY_BASIC_VARIANT_ID=67890
LEMONSQUEEZY_PRO_VARIANT_ID=67891

# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Миграция базы данных

Миграция `create_subscription_system` уже применена и создала все необходимые таблицы.

## Функции

### Автоматический пробный период
- При регистрации пользователь автоматически получает 14-дневный Pro план
- Не требует привязки карты
- Автоматически истекает через 14 дней

### Обработка вебхуков
- Автоматическое обновление статуса подписок
- Логирование всех изменений в `subscription_history`
- Обработка всех событий LemonSqueezy

### Навигация
- Добавлена ссылка "Подписка" в админ-панель
- Доступна на всех языках (ru, en, ka, ar)
- Автоматическая навигация при клике

## Безопасность

### RLS Policies
- Пользователи видят только свои подписки
- Планы и скидки доступны всем для просмотра
- История подписок защищена по user_id

### Проверка подписи вебхуков
- Все вебхуки проверяются на подлинность
- Используется HMAC SHA-256
- Отклонение неверных подписей

## Мониторинг

### Логирование
- Все изменения подписок записываются в `subscription_history`
- Ошибки вебхуков логируются в консоль
- Отслеживание всех действий пользователей

### Аналитика
- Статусы подписок
- Конверсия пробных периодов
- Популярность планов и периодов

## Развертывание

1. Примените миграцию базы данных
2. Деплойте Edge Functions
3. Настройте переменные окружения
4. Настройте вебхуки в LemonSqueezy
5. Протестируйте интеграцию

## Тестирование

1. Включите тестовый режим в LemonSqueezy
2. Создайте тестового пользователя
3. Проверьте автоматическое создание пробного периода
4. Протестируйте checkout flow
5. Проверьте обработку вебхуков
6. Протестируйте отмену подписки

Система готова к использованию и полностью интегрирована в приложение!
