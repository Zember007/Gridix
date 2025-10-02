# Улучшения системы подписок

## 📋 Обзор изменений

Проведена полная доработка системы управления подписками для корректной обработки всех сценариев работы с LemonSqueezy webhook и улучшенного отображения на фронтенде.

---

## 🔧 Backend изменения (Webhook)

### 1. **Добавлена универсальная функция определения плана**

```typescript
async function getPlanIdFromProductName(productName)
```

- Принимает название продукта из LemonSqueezy
- Возвращает ID плана из базы данных
- Поддерживает различные варианты названий ("Basic Plan", "Basic", "Pro Plan", "Pro")
- Устраняет дублирование кода

### 2. **Улучшен `handleSubscriptionUpdated`**

**Что добавлено:**
- ✅ **Автоматическое обновление `plan_id`** при смене плана (upgrade/downgrade)
- ✅ Логирование изменения плана в историю с action="plan_changed"
- ✅ Корректное обновление всех полей подписки
- ✅ Поддержка `attributes.ends_at` для правильного определения даты окончания

**Сценарии:**
- Переход с Basic на Pro → обновляется `plan_id` и логируется
- Переход с Pro на Basic → обновляется `plan_id` и логируется
- Обновление без смены плана → логируется как "subscription_updated"

### 3. **Исправлен `handleSubscriptionResumed`**

**Что исправлено:**
- ✅ Сброс `cancel_at_period_end = false`
- ✅ Сброс `cancelled_at = null`
- ✅ Использование `attributes.status` вместо hardcoded "active"
- ✅ Обновление даты окончания периода

**Когда вызывается:**
- Пользователь возобновляет отмененную подписку
- Подписка восстанавливается после паузы (`subscription_unpaused`)

### 4. **Добавлена новая функция `handleSubscriptionExpired`**

```typescript
async function handleSubscriptionExpired(data)
```

**Функционал:**
- ✅ Устанавливает статус `"expired"`
- ✅ Обновляет `current_period_end` из `attributes.ends_at`
- ✅ Логирует действие в историю подписок
- ✅ **НЕ удаляет запись** - сохраняется для истории

**Важно:** Записи истекших подписок **НЕ удаляются** из базы данных. Это позволяет:
- Сохранять историю подписок пользователя
- Проводить аналитику
- Восстанавливать данные при необходимости
- Соблюдать требования аудита

### 5. **Обновлен switch-case обработки событий**

```typescript
case "subscription_expired":
  await handleSubscriptionExpired(data);  // ← Теперь отдельная функция
  break;
  
case "subscription_unpaused":
  await handleSubscriptionResumed(data);  // ← Используем resumed вместо updated
  break;
```

---

## 🎨 Frontend изменения

### 1. **SubscriptionManager - улучшенное отображение статусов**

**Добавлено:**
- ✅ **Badge для отменяемых подписок**: "Активна (отменяется)" для подписок с `cancel_at_period_end=true`
- ✅ Поддержка статуса `"expired"`
- ✅ Поддержка статуса `"paused"`
- ✅ **Предупреждение об отмене**: оранжевый блок с информацией о том, что подписка будет отменена

**Визуальные индикаторы:**
- 🟢 Зеленый badge - активная подписка
- 🔵 Синий badge - пробный период
- 🟠 Оранжевый badge - активна, но отменяется
- 🔴 Красный badge - отменена
- ⚪ Серый badge - истекла/приостановлена

**Пример предупреждения:**
```
⚠️ Подписка будет отменена в конце текущего периода. 
Вы сохраняете доступ до 15.03.2025
```

### 2. **SubscriptionPage - улучшенная логика активности**

**Обновлено:**
```typescript
const hasActiveSubscription = subscription && 
  (['active', 'trialing'].includes(subscription.subscription.status) || 
  (subscription.subscription.cancel_at_period_end && 
   subscription.subscription.current_period_end && 
   new Date(subscription.subscription.current_period_end) > new Date()));
```

**Теперь считается активной:**
- ✅ Подписка со статусом "active"
- ✅ Подписка со статусом "trialing"
- ✅ Отмененная подписка, если до конца оплаченного периода еще есть время

**Добавлено:**
- ✅ Отображение карточки "Подписка истекла" для статуса `"expired"`
- ✅ Разделение сообщений для trial_expired и expired

### 3. **useSubscription Hook - улучшенная функция `isActive()`**

**Обновленная логика:**
```typescript
const isActive = (): boolean => {
  if (!subscription) return false;
  
  const { status, current_period_end } = subscription.subscription;
  
  // Проверка активного статуса
  if (['active', 'trialing'].includes(status)) {
    return true;
  }
  
  // Проверка отмененной подписки в оплаченном периоде
  if (subscription.subscription.cancel_at_period_end && current_period_end) {
    return new Date(current_period_end) > new Date();
  }
  
  return false;
};
```

### 4. **PricingPlans - корректное определение текущего плана**

**Обновлено:**
```typescript
const isCurrentPlan = (planSlug: string) => {
  if (!subscription) return false;
  
  // Проверка текущего активного плана
  return subscription.subscription.subscription_plans.slug === planSlug &&
         ['active', 'trialing'].includes(subscription.subscription.status);
};
```

**Теперь:**
- ✅ Кнопка "Текущий план" отключена только для действительно активных подписок
- ✅ Для истекших/отмененных подписок можно переоформить тот же план

---

## 📊 Сценарии использования

### Сценарий 1: Отмена подписки с сохранением доступа

**Действия пользователя:**
1. Пользователь отменяет подписку через LemonSqueezy
2. Подписка еще оплачена до 15.03.2025

**Что происходит:**
1. Приходит webhook `subscription_updated` с `cancelled=true`
2. Устанавливается:
   - `status` = "active" (или "trialing")
   - `cancel_at_period_end` = true
   - `cancelled_at` = текущая дата
   - `current_period_end` = 15.03.2025
3. На фронте:
   - Badge: "Активна (отменяется)" 🟠
   - Предупреждение: "⚠️ Подписка будет отменена в конце текущего периода"
   - Доступ ко всем функциям сохраняется
   - Кнопка "Управление подпиской" доступна

**15.03.2025 наступает:**
1. Приходит webhook `subscription_expired`
2. Вызывается `handleSubscriptionExpired()`
3. Устанавливается `status` = "expired"
4. Запись **НЕ удаляется** из базы
5. На фронте:
   - Отображается карточка "Подписка истекла"
   - Показываются планы для выбора
   - Доступ к премиум-функциям блокируется

### Сценарий 2: Возобновление отмененной подписки

**Действия пользователя:**
1. Пользователь отменил подписку (cancel_at_period_end=true)
2. Пользователь передумал и возобновил подписку через LemonSqueezy

**Что происходит:**
1. Приходит webhook `subscription_resumed`
2. Вызывается `handleSubscriptionResumed()`
3. Обновляется:
   - `status` = "active"
   - `cancel_at_period_end` = false
   - `cancelled_at` = null
4. На фронте:
   - Badge снова "Активна" 🟢
   - Предупреждение исчезает
   - Подписка продолжает работать

### Сценарий 3: Переход с Basic на Pro

**Действия пользователя:**
1. У пользователя Basic план
2. Пользователь оформляет Pro план через LemonSqueezy

**Что происходит:**
1. Приходит webhook `subscription_updated` или `subscription_created`
2. Вызывается `getPlanIdFromProductName("Pro Plan")`
3. Определяется новый `plan_id`
4. Обновляется:
   - `plan_id` = ID Pro плана
   - Остальные данные подписки
5. Логируется в историю:
   - `action` = "plan_changed"
   - `metadata.plan_changed` = true
   - `metadata.product_name` = "Pro Plan"
6. На фронте:
   - Отображается "План Pro"
   - Crown icon рядом с названием плана
   - Доступны все Pro-функции

---

## ✅ Что улучшено

### Backend
- ✅ Полная поддержка смены тарифных планов
- ✅ Корректная обработка отмены с сохранением доступа
- ✅ Правильная обработка истечения подписок
- ✅ Логирование всех действий в subscription_history
- ✅ Сохранение истории подписок (без удаления)
- ✅ Устранение дублирования кода

### Frontend
- ✅ Визуальная индикация отменяемых подписок
- ✅ Предупреждения для пользователей
- ✅ Корректное определение активности подписки
- ✅ Правильная работа при смене планов
- ✅ Поддержка всех возможных статусов
- ✅ Улучшенный UX при работе с подписками

---

## 🔄 Обработка всех событий

| Событие | Функция | Действие |
|---------|---------|----------|
| `subscription_created` | `handleSubscriptionCreated` | Создание новой подписки |
| `subscription_updated` | `handleSubscriptionUpdated` | Обновление подписки + смена плана |
| `subscription_cancelled` | `handleSubscriptionCancelled` | Немедленная отмена |
| `subscription_resumed` | `handleSubscriptionResumed` | Возобновление подписки |
| `subscription_expired` | `handleSubscriptionExpired` | ⭐ Истечение подписки (новое!) |
| `subscription_paused` | `handleSubscriptionUpdated` | Приостановка |
| `subscription_unpaused` | `handleSubscriptionResumed` | ⭐ Снятие с паузы (обновлено!) |

---

## 📝 Рекомендации

### При разработке
1. **Тестируйте все сценарии** через LemonSqueezy sandbox
2. **Проверяйте логи** webhook в Supabase Edge Functions
3. **Следите за subscription_history** для отладки

### В продакшене
1. **Мониторьте webhook** на наличие ошибок
2. **Проверяйте корректность** обновления plan_id
3. **Убедитесь**, что даты current_period_end правильные
4. **Не удаляйте записи** истекших подписок без крайней необходимости

---

## 🎯 Итог

Система подписок теперь:
- ✅ Корректно обрабатывает **ВСЕ** события от LemonSqueezy
- ✅ Правильно работает с **отменами** подписок
- ✅ Поддерживает **смену тарифных планов**
- ✅ Показывает пользователю **понятную информацию**
- ✅ Сохраняет **полную историю** для аналитики
- ✅ Соответствует **лучшим практикам** SaaS

**Все задачи выполнены!** 🎉


