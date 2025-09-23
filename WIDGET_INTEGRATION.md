# Интеграция Script-Based Виджетов

## Обзор изменений

Концепция виджетов была изменена с iframe-подхода на script-based интеграцию. Это позволяет виджетам интегрироваться напрямую в DOM страницы клиента, обеспечивая лучшую производительность и гибкость.

## Основные изменения

### 1. AdminWidgets.tsx
- Изменен метод `generateEmbedCode()` для генерации script-based кода вместо iframe
- Обновлен метод `openPreview()` для работы с новыми URL предварительного просмотра
- Изменена секция ссылок для отображения новых endpoint'ов

### 2. Новые файлы

#### `/public/widget.js`
Основной JavaScript файл виджета, который:
- Загружается асинхронно на страницу клиента
- Читает конфигурацию из `window.GridixWidgetConfig`
- Загружает данные через API
- Создает HTML структуру виджета
- Применяет CSS стили
- Обеспечивает интерактивность

#### `/src/pages/WidgetPreviewPage.tsx`
Страница для предварительного просмотра виджетов:
- Поддерживает параметры URL для конфигурации
- Загружает и инициализирует виджет
- Показывает информацию о конфигурации

#### `/supabase/functions/widget-api/index.ts`
API endpoint для виджетов:
- `GET /api/widget/projects/:userId` - получение проектов пользователя
- `GET /api/widget/project/:projectSlug` - получение конкретного проекта по slug
- `GET /api/widget/project/id/:projectId` - получение проекта по ID
- Поддержка параметра `lang` для локализации

### 3. Обновленные файлы

#### `/src/App.tsx`
- Добавлен маршрут для страницы предварительного просмотра виджетов

#### `/vite.config.ts`
- Добавлен прокси для API запросов виджетов

#### `/src/contexts/LanguageContext.tsx`
- Добавлены новые переводы для виджетов

## Как использовать

### Код для интеграции
```html
<!-- Gridix Widget -->
<div id="gridix-widget-container"></div>
<script>
  window.GridixWidgetConfig = {
    "type": "projects", // или "project"
    "userId": "user-id", // для типа "projects"
    "projectId": "project-id", // для типа "project"
    "projectSlug": "project-slug", // для типа "project"
    "language": "ru" // ru, en, ka, ar
  };
</script>
<script src="https://your-domain.com/widget.js" async></script>
```

### Типы виджетов

#### 1. Список проектов пользователя
```javascript
window.GridixWidgetConfig = {
  type: 'projects',
  userId: 'user-id',
  language: 'ru'
};
```

#### 2. Отдельный проект
```javascript
window.GridixWidgetConfig = {
  type: 'project',
  projectSlug: 'project-slug', // или projectId
  language: 'ru'
};
```

### URL для тестирования
- **Скрипт виджета**: `https://your-domain.com/widget.js`
- **Предварительный просмотр**: `https://your-domain.com/widget/preview?type=projects&userId=USER_ID&lang=ru`
- **Тестовая страница**: `https://your-domain.com/widget-test.html`

## API Endpoints

### GET /api/widget/projects/:userId
Возвращает список проектов пользователя с минимальными ценами.

**Параметры:**
- `lang` (optional) - язык интерфейса (ru, en, ka, ar)

**Ответ:**
```json
{
  "projects": [
    {
      "id": "project-id",
      "name": "Project Name",
      "description": "Project Description",
      "slug": "project-slug",
      "image_url": "https://...",
      "min_price": 1000000
    }
  ]
}
```

### GET /api/widget/project/:projectSlug
### GET /api/widget/project/id/:projectId
Возвращает информацию о конкретном проекте.

**Параметры:**
- `lang` (optional) - язык интерфейса

**Ответ:**
```json
{
  "projects": [
    {
      "id": "project-id",
      "name": "Project Name",
      "description": "Project Description",
      "slug": "project-slug",
      "image_url": "https://...",
      "min_price": 1000000
    }
  ]
}
```

## Преимущества нового подхода

1. **Лучшая производительность** - нет накладных расходов iframe
2. **SEO-friendly** - контент виджета индексируется поисковиками
3. **Гибкость стилизации** - можно легко кастомизировать внешний вид
4. **Отзывчивость** - виджет адаптируется к размерам родительского контейнера
5. **Безопасность** - виджет работает в том же домене, что и основной сайт

## Развертывание

1. Убедитесь, что Supabase Edge Function `widget-api` развернута
2. Настройте прокси в production для `/api/widget/*` запросов
3. Обеспечьте доступность файла `/widget.js` через CDN или веб-сервер
4. Протестируйте виджет на тестовой странице `/widget-test.html`

## Troubleshooting

### Виджет не загружается
1. Проверьте, что файл `widget.js` доступен
2. Убедитесь, что `window.GridixWidgetConfig` установлен перед загрузкой скрипта
3. Проверьте консоль браузера на наличие ошибок

### API возвращает ошибки
1. Убедитесь, что Supabase Edge Function развернута
2. Проверьте настройки CORS
3. Убедитесь, что проекты опубликованы (`is_published = true`)

### Проблемы со стилями
1. Проверьте, что CSS стили виджета не конфликтуют с сайтом
2. При необходимости добавьте CSS изоляцию
3. Кастомизируйте стили в файле `widget.js`
