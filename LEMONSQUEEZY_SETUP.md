# Настройка LemonSqueezy для системы подписок

## 1. Создание аккаунта и настройка магазина

1. Зарегистрируйтесь на [LemonSqueezy](https://lemonsqueezy.com)
2. Создайте новый магазин
3. Получите Store ID из настроек магазина

## 2. Создание продуктов

### Basic Plan ($79)
1. Создайте новый продукт "Basic Plan"
2. Установите цену $79
3. Создайте варианты для разных периодов:
   - 1 месяц: $79
   - 3 месяца: $225 (скидка 5%)
   - 6 месяцев: $427 (скидка 10%)
   - 12 месяцев: $759 (скидка 20%)
   - 24 месяца: $1328 (скидка 30%)
   - 36 месяцев: $1422 (скидка 50%)

### Pro Plan ($129)
1. Создайте новый продукт "Pro Plan"
2. Установите цену $129
3. Создайте варианты для разных периодов:
   - 1 месяц: $129
   - 3 месяца: $367 (скидка 5%)
   - 6 месяцев: $697 (скидка 10%)
   - 12 месяцев: $1238 (скидка 20%)
   - 24 месяца: $2167 (скидка 30%)
   - 36 месяцев: $2322 (скидка 50%)

## 3. Получение API ключей

1. Перейдите в Settings > API
2. Создайте новый API ключ
3. Скопируйте API ключ для использования в переменных окружения

## 4. Настройка вебхуков

1. В настройках магазина перейдите в Webhooks
2. Создайте новый вебхук с URL: `https://your-domain.com/functions/v1/lemonsqueezy-webhook`
3. Выберите следующие события:
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_resumed`
   - `subscription_expired`
   - `subscription_paused`
   - `subscription_unpaused`
4. Скопируйте Webhook Secret

## 5. Переменные окружения

Добавьте следующие переменные в ваш проект Supabase:

### В Supabase Dashboard > Settings > Secrets:

```
LEMONSQUEEZY_API_KEY=lmsq_sk_...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=wh_...
LEMONSQUEEZY_BASIC_VARIANT_ID=67890
LEMONSQUEEZY_PRO_VARIANT_ID=67891
```

### В вашем .env файле:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
LEMONSQUEEZY_API_KEY=lmsq_sk_...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=wh_...
LEMONSQUEEZY_BASIC_VARIANT_ID=67890
LEMONSQUEEZY_PRO_VARIANT_ID=67891
VITE_APP_URL=http://localhost:5173
```

## 6. Тестирование

1. Включите тестовый режим в LemonSqueezy
2. Создайте тестовые продукты с теми же настройками
3. Используйте тестовые API ключи для разработки
4. Протестируйте весь флоу подписки:
   - Регистрация нового пользователя (должен получить 14-дневный пробный период Pro)
   - Создание checkout сессии
   - Обработка вебхуков
   - Отмена подписки

## 7. Развертывание

1. Переключитесь на продакшн режим в LemonSqueezy
2. Обновите переменные окружения на продакшн значения
3. Убедитесь, что вебхук URL указывает на продакшн домен
4. Протестируйте на продакшне с небольшими суммами

## Структура базы данных

Система создает следующие таблицы:
- `subscription_plans` - тарифные планы
- `subscription_discounts` - скидки по длительности
- `user_subscriptions` - подписки пользователей
- `subscription_history` - история изменений подписок

## API Endpoints

Edge Functions предоставляют следующие эндпоинты:

### `/functions/v1/subscription-management`
- `GET /subscription` - получить подписку пользователя
- `GET /plans` - получить все планы с ценами
- `POST /create-checkout` - создать checkout сессию
- `POST /cancel-subscription` - отменить подписку

### `/functions/v1/lemonsqueezy-webhook`
- `POST /` - обработка вебхуков от LemonSqueezy

## Компоненты React

- `PricingPlans` - компонент выбора тарифного плана
- `SubscriptionManager` - управление текущей подпиской
- `SubscriptionGuard` - защита контента по подписке
- `useSubscription` - хук для работы с подпиской

## Использование в коде

```tsx
import { SubscriptionGuard } from './components/subscription';
import { useSubscription } from './hooks/useSubscription';

// Защита компонента
<SubscriptionGuard requiredPlan="pro" requiredFeature="CRM integration">
  <CRMIntegrationComponent />
</SubscriptionGuard>

// Проверка в хуке
const { hasFeature, isPro } = useSubscription();

if (hasFeature('Custom domain')) {
  // Показать функцию персонального домена
}
```
