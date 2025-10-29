# Оптимизация изображений в WebP

⚠️ **ВАЖНО**: Edge Function имеет ограничения в Deno и не может обработать все типы изображений. 

**Рекомендуется использовать локальный скрипт** (см. ниже) для надежной обработки всех изображений.

## Параметры сжатия

- **maxSizeMB**: 1 МБ
- **maxWidthOrHeight**: 1920px
- **Качество WebP**: 0.8

## Вариант 1: Локальный скрипт (РЕКОМЕНДУЕТСЯ) ⭐

Для надежной обработки всех изображений используйте локальный Node.js скрипт:

### Установка:

```bash
cd web
npm install sharp dotenv
```

### Настройка:

Создайте файл `.env` в корне проекта `web/`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Запуск:

```bash
node scripts/optimize-images-local.js
```

Скрипт обработает все изображения с использованием библиотеки `sharp`, которая поддерживает все форматы и работает стабильно.

---

## Вариант 2: Edge Function (Ограниченная поддержка)

Edge Function может обработать только часть изображений из-за ограничений Deno.

## Как вызвать функцию

### 1. Через Supabase Dashboard

1. Откройте ваш проект в [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдите в раздел **Edge Functions** (в боковом меню слева)
3. Найдите функцию `optimize-images` в списке
4. Нажмите на функцию, чтобы открыть детали
5. В открывшемся окне нажмите кнопку **Invoke Function** или **Test Function**
6. В теле запроса можно оставить пустым `{}` или не указывать его, функция не требует параметров
7. Нажмите **Invoke** или **Run**

### 2. Через HTTP запрос (из браузера или Postman)

После деплоя функция будет доступна по URL:

```
https://[YOUR_PROJECT_REF].supabase.co/functions/v1/optimize-images
```

Для вызова используйте POST запрос:

```bash
curl -X POST \
  'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/optimize-images' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Или через JavaScript:

```javascript
const response = await fetch(
  'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/optimize-images',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({})
  }
);

const result = await response.json();
console.log(result);
```

### 3. Через Supabase CLI

```bash
supabase functions invoke optimize-images
```

## Деплой функции

Перед первым использованием функцию нужно задеплоить:

```bash
cd web
supabase functions deploy optimize-images
```

## Ответ функции

После выполнения функция вернет JSON с результатами:

```json
{
  "message": "Image optimization completed",
  "processed": 150,
  "totalFiles": 150,
  "urlMappings": 150,
  "databaseUpdated": 145,
  "errors": []
}
```

Или в случае ошибок:

```json
{
  "message": "Image optimization completed",
  "processed": 145,
  "totalFiles": 150,
  "urlMappings": 145,
  "databaseUpdated": 140,
  "errors": [
    "apartments/123.jpg: Failed to download",
    "layout_photos: Connection timeout"
  ]
}
```

## Важные замечания

⚠️ **Внимание**: Эта функция:
- Удаляет оригинальные файлы (jpg/png) после успешной конвертации
- Заменяет их на WebP версии
- Обновляет все ссылки в базе данных автоматически

🔒 **Безопасность**: 
- Функция использует `SERVICE_ROLE_KEY` для доступа ко всем данным
- Вызывайте функцию только при необходимости
- Рекомендуется сделать резервную копию перед первым запуском

⏱️ **Время выполнения**:
- Зависит от количества изображений
- Обрабатывает 10 файлов параллельно
- Для большого количества изображений может потребоваться несколько минут

## Логи

Логи выполнения можно посмотреть в разделе **Edge Functions** → `optimize-images` → **Logs** в Supabase Dashboard.

