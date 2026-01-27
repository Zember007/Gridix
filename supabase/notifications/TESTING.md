# Тестирование OneSignal Email архитектуры

Пошаговое руководство по тестированию всех компонентов системы уведомлений.

## 📋 Предварительные требования

1. **Применить миграцию БД:**
   ```bash
   # В Supabase Dashboard → SQL Editor выполните:
   # supabase/migrations/20260127_onesignal_notifications.sql
   ```

2. **Установить секреты в Supabase:**
   - Dashboard → Project Settings → Edge Functions → Secrets
   - Добавьте:
     - `ONESIGNAL_APP_ID` (UUID вашего OneSignal App)
     - `ONESIGNAL_REST_API_KEY` (REST API Key из OneSignal Dashboard)
   
   Примечание:
   - Функции `onesignal-sync-user` и `onesignal-webhook` сейчас проверяют заголовок `x-gridix-webhook-secret`
     на совпадение с `JWT_SECRET` (секрет Supabase проекта для подписи JWT).

3. **Деплой Edge Functions:**
   ```bash
   cd gridix-app
   supabase functions deploy onesignal-sync-user
   supabase functions deploy notifications-send-email
   supabase functions deploy onesignal-webhook
   ```

---

## 🧪 Тест 1: Создание тестового шаблона

**Цель:** Проверить, что шаблоны сохраняются и доступны для рендеринга.

### Шаг 1.1: Вставка тестового шаблона в БД

Выполните в Supabase SQL Editor:

```sql
INSERT INTO public.notification_templates (
  key,
  channel,
  locale,
  subject_template,
  html_template,
  schema,
  is_active
) VALUES (
  'test_welcome',
  'email',
  'en',
  'Welcome to {{app.name}}!',
  '<html><body><h1>Hello {{user.full_name}}!</h1><p>Welcome to {{{app.url}}}</p></body></html>',
  '{"user": {"full_name": "string"}, "app": {"name": "string", "url": "string"}}'::jsonb,
  true
) ON CONFLICT (key, channel, locale) DO UPDATE SET
  subject_template = EXCLUDED.subject_template,
  html_template = EXCLUDED.html_template,
  updated_at = now();
```

### Шаг 1.2: Проверка шаблона

```sql
SELECT * FROM public.notification_templates 
WHERE key = 'test_welcome' AND channel = 'email';
```

Ожидаемый результат: одна запись с `is_active = true`.

---

## 🧪 Тест 2: Синхронизация пользователя в OneSignal

**Цель:** Проверить создание OneSignal User + Email subscription при регистрации.

### Вариант A: Ручной вызов через curl (для тестирования)

```bash
# Замените значения:
SUPABASE_URL="https://ebonmrtmfopohayxfvdy.supabase.co"
SERVICE_ROLE_KEY="your-service-role-key"
TEST_USER_ID="uuid-существующего-пользователя"
TEST_EMAIL="test@example.com"
WEBHOOK_SECRET="ваш-JWT_SECRET"

curl -X POST "${SUPABASE_URL}/functions/v1/onesignal-sync-user" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "supabase_user_id": "'"${TEST_USER_ID}"'",
    "email": "'"${TEST_EMAIL}"'",
    "enabled": true,
    "locale": "en",
    "tags": {
      "account_type": "developer",
      "test": "true"
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "supabase_user_id": "...",
  "onesignal_id": "uuid-onesignal-user"
}
```

### Вариант B: Проверка через БД

```sql
-- Проверьте, что запись создалась
SELECT 
  supabase_user_id,
  onesignal_id,
  email,
  enabled,
  last_synced_at,
  last_error
FROM public.onesignal_user_links
WHERE supabase_user_id = 'ваш-test-user-id';
```

### Вариант C: Проверка в OneSignal Dashboard

1. Откройте OneSignal Dashboard → **Audience → Users**
2. Найдите пользователя по `external_id` (ваш `supabase_user_id`)
3. Проверьте, что есть **Email subscription** со статусом **Subscribed**

---

## 🧪 Тест 3: Отправка тестового email

**Цель:** Проверить полный цикл: загрузка шаблона → рендеринг → отправка через OneSignal.

### Шаг 3.1: Подготовка тестового пользователя

Убедитесь, что:
- Пользователь существует в `user_profiles`
- Есть запись в `onesignal_user_links` (или функция создаст её автоматически)

### Шаг 3.2: Отправка email

```bash
SUPABASE_URL="https://ebonmrtmfopohayxfvdy.supabase.co"
SERVICE_ROLE_KEY="your-service-role-key"
TEST_USER_ID="uuid-получателя"
ANON_KEY="your-anon-key"  # или используйте SERVICE_ROLE_KEY

curl -X POST "${SUPABASE_URL}/functions/v1/notifications-send-email" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_key": "test_welcome",
    "recipient_user_id": "'"${TEST_USER_ID}"'",
    "locale": "en",
    "payload": {
      "user": {
        "full_name": "Test User"
      },
      "app": {
        "name": "Gridix",
        "url": "https://gridix.live"
      }
    }
  }'
```

**Ожидаемый ответ:**
```json
{
  "success": true,
  "job_id": "uuid-job-id",
  "onesignal_message_id": "uuid-onesignal-message-id",
  "onesignal_response": {...}
}
```

### Шаг 3.3: Проверка job в БД

```sql
SELECT 
  id,
  template_key,
  recipient_user_id,
  status,
  attempts,
  onesignal_message_id,
  last_error,
  created_at,
  sent_at
FROM public.notification_jobs
WHERE recipient_user_id = 'ваш-test-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

**Ожидаемые значения:**
- `status` = `'sent'`
- `onesignal_message_id` не NULL
- `sent_at` не NULL
- `last_error` NULL

### Шаг 3.4: Проверка в OneSignal Dashboard

1. **Messages → View Messages**
   - Найдите сообщение по `onesignal_message_id`
   - Проверьте статус доставки

2. **Audience → Subscriptions**
   - Найдите email subscription получателя
   - Проверьте, что статус **Subscribed**

3. **Проверьте почтовый ящик** получателя (включая спам)

---

## 🧪 Тест 4: Автоматическая синхронизация при регистрации

**Цель:** Проверить Database Webhook → автоматическое создание OneSignal subscription.

### Шаг 4.1: Настройка Database Webhook

В Supabase Dashboard:

1. **Database → Webhooks → Create a new webhook**
2. **Настройки:**
   - **Name:** `onesignal-sync-on-user-registration`
   - **Table:** `public.user_profiles`
   - **Events:** `INSERT`, `UPDATE`
   - **HTTP Request:**
     - **URL:** `https://ebonmrtmfopohayxfvdy.supabase.co/functions/v1/onesignal-sync-user`
     - **HTTP Method:** `POST`
     - **HTTP Headers:**
       ```
       x-gridix-webhook-secret: ваш-JWT_SECRET
       Content-Type: application/json
       ```
     - **HTTP Request Body:**
       ```json
       {
         "supabase_user_id": "{{record.id}}",
         "email": "{{record.email}}",
         "enabled": true,
         "locale": "en",
         "tags": {
           "account_type": "{{record.account_type}}"
         }
       }
       ```

### Шаг 4.2: Тестирование webhook

**Вариант A: Создание тестового пользователя через UI**

1. Зарегистрируйте нового пользователя в приложении
2. Проверьте логи webhook в Supabase Dashboard → Database → Webhooks → Logs
3. Проверьте `onesignal_user_links`:

```sql
SELECT * FROM public.onesignal_user_links
WHERE email = 'email-нового-пользователя';
```

**Вариант B: Ручная вставка в БД (для быстрого теста)**

```sql
-- Вставьте тестовую запись (если у вас есть триггер на INSERT)
INSERT INTO public.user_profiles (id, email, full_name, account_type)
VALUES (
  gen_random_uuid(),
  'webhook-test@example.com',
  'Webhook Test',
  'developer'
);
```

Затем проверьте `onesignal_user_links` и логи webhook.

---

## 🧪 Тест 5: Обработка ошибок

### Тест 5.1: Неверный template_key

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/notifications-send-email" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_key": "nonexistent_template",
    "recipient_user_id": "'"${TEST_USER_ID}"'"
  }'
```

**Ожидаемый ответ:** `404` с `"error": "Template not found"`

### Тест 5.2: Неверный recipient_user_id

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/notifications-send-email" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "template_key": "test_welcome",
    "recipient_user_id": "00000000-0000-0000-0000-000000000000"
  }'
```

**Ожидаемый результат:**
- Job создаётся со статусом `failed`
- `last_error` содержит описание проблемы
- Проверьте в БД:

```sql
SELECT status, last_error FROM public.notification_jobs
WHERE id = 'job-id-из-ответа';
```

### Тест 5.3: Неверный webhook secret

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/onesignal-sync-user" \
  -H "x-gridix-webhook-secret: wrong-secret" \
  -H "Content-Type: application/json" \
  -d '{"supabase_user_id": "...", "email": "test@example.com"}'
```

**Ожидаемый ответ:** `401 Unauthorized`

---

## 🧪 Тест 6: Webhook от OneSignal (опционально)

**Цель:** Проверить сохранение событий доставки/отписки.

### Шаг 6.1: Настройка в OneSignal Dashboard

1. **Settings → Integrations → Webhooks**
2. **Add Webhook:**
   - **URL:** `https://ebonmrtmfopohayxfvdy.supabase.co/functions/v1/onesignal-webhook`
   - **Events:** выберите нужные (например, `email.delivered`, `email.bounced`, `email.unsubscribed`)
   - **HTTP Headers:**
     ```
     x-gridix-webhook-secret: ваш-JWT_SECRET
     ```

### Шаг 6.2: Проверка сохранения событий

После отправки email и получения webhook от OneSignal:

```sql
SELECT 
  id,
  job_id,
  onesignal_message_id,
  event_type,
  payload,
  created_at
FROM public.notification_events
WHERE onesignal_message_id = 'ваш-onesignal-message-id'
ORDER BY created_at DESC;
```

---

## ✅ Чеклист успешного тестирования

- [ ] Миграция применена, таблицы созданы
- [ ] Секреты установлены в Supabase
- [ ] Edge Functions задеплоены
- [ ] Тестовый шаблон создан в БД
- [ ] Ручная синхронизация пользователя работает (`onesignal-sync-user`)
- [ ] Пользователь появился в OneSignal Dashboard с email subscription
- [ ] Отправка email работает (`notifications-send-email`)
- [ ] Job создаётся в БД со статусом `sent`
- [ ] Email доставлен в почтовый ящик
- [ ] Database Webhook настроен и работает при регистрации
- [ ] Ошибки обрабатываются корректно (неверный template, неверный user_id)
- [ ] (Опционально) OneSignal webhook сохраняет события в `notification_events`

---

## 🔍 Отладка

### Просмотр логов Edge Functions

```bash
# Supabase CLI
supabase functions logs onesignal-sync-user
supabase functions logs notifications-send-email
supabase functions logs onesignal-webhook

# Или в Dashboard:
# Project Settings → Edge Functions → Logs
```

### Проверка статусов в БД

```sql
-- Статистика по jobs
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as last_created
FROM public.notification_jobs
GROUP BY status;

-- Последние ошибки
SELECT 
  id,
  template_key,
  recipient_user_id,
  status,
  last_error,
  attempts,
  created_at
FROM public.notification_jobs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- Пользователи без OneSignal subscription
SELECT 
  up.id,
  up.email,
  up.full_name,
  osl.onesignal_id
FROM public.user_profiles up
LEFT JOIN public.onesignal_user_links osl ON up.id = osl.supabase_user_id
WHERE osl.supabase_user_id IS NULL
LIMIT 10;
```

### Частые проблемы

1. **"Missing ONESIGNAL_APP_ID"**
   - Проверьте, что секрет установлен в Supabase Dashboard

2. **"Template not found"**
   - Убедитесь, что шаблон существует и `is_active = true`
   - Проверьте `locale` (должен совпадать или быть `en` для fallback)

3. **"OneSignal accepted request but returned empty message id"**
   - Пользователь не имеет активной email subscription в OneSignal
   - Проверьте `onesignal_user_links.enabled = true`
   - Убедитесь, что email подтверждён в OneSignal

4. **Webhook не срабатывает**
   - Проверьте логи webhook в Supabase Dashboard
   - Убедитесь, что `x-gridix-webhook-secret` совпадает с `JWT_SECRET` проекта
   - Проверьте формат JSON body webhook

---

## 📚 Дополнительные ресурсы

- [OneSignal Email API Reference](https://documentation.onesignal.com/reference/email)
- [OneSignal Users API Reference](https://documentation.onesignal.com/reference/create-user)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
