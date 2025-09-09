# Тестирование Edge Function create-amocrm-lead

## Локальное тестирование

### Запуск локально

```bash
supabase functions serve create-amocrm-lead
```

### Тестовый запрос

```bash
curl -X POST http://localhost:54321/functions/v1/create-amocrm-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "phone": "+7 900 123-45-67",
    "apartmentId": "test-apartment-id",
    "projectId": "test-project-id"
  }'
```

## Тестирование в продакшене

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-amocrm-lead \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "name": "Тест Тестов",
    "email": "test@example.com", 
    "phone": "+7 900 000-00-00",
    "apartmentId": "real-apartment-id",
    "projectId": "real-project-id"
  }'
```

## Ожидаемые ответы

### Успешный ответ
```json
{
  "success": true,
  "leadId": 12345,
  "message": "Lead successfully created in AmoCRM"
}
```

### Ошибка - настройки не найдены
```json
{
  "error": "AmoCRM integration not configured for this project"
}
```

### Ошибка - неверные данные
```json
{
  "error": "Missing required fields"
}
```

## Проверка логов

```bash
supabase functions logs create-amocrm-lead
```
