# Widget с Shadow DOM и изоляцией стилей

## Обзор

Виджет теперь использует **Shadow DOM** для полной изоляции стилей. Это означает:

✅ Стили виджета не влияют на родительскую страницу  
✅ Стили родительской страницы не влияют на виджет  
✅ Tailwind CSS стили виджета полностью изолированы  
✅ Предсказуемое поведение на любом сайте  

## Способы сборки виджета

### 1. Стандартная сборка (widget.js + style.css)

```bash
npm run build:widget
```

Создаёт:
- `dist-widget/widget.js` - код виджета
- `dist-widget/style.css` - все стили (включая Tailwind)

**Использование:**

```html
<div id="gridix-widget-root"></div>
<script src="https://yoursite.com/widget.js"></script>
<script>
  GridixWidget.init({
    projectId: 'your-project-id',
    cssUrl: 'https://yoursite.com/style.css', // явно указываем путь к CSS
    width: '100%',
    height: '600px'
  });
</script>
```

### 2. Inline сборка (всё в одном файле) ⭐ Рекомендуется

```bash
npm run build:widget-inline
```

Создаёт `dist-widget/widget-inline.js` - один файл со встроенными стилями.

**Использование:**

```html
<div id="gridix-widget-root"></div>
<script src="https://yoursite.com/widget-inline.js"></script>
<script>
  GridixWidget.init({
    projectId: 'your-project-id',
    width: '100%',
    height: '600px'
  });
</script>
```

**Преимущества:**
- ✅ Один файл - проще деплоить
- ✅ Нет проблем с путями к CSS
- ✅ Гарантированно работает на любом хостинге
- ✅ Стили всегда загружаются корректно в Shadow DOM

## Параметры инициализации

```typescript
type InitOptions = {
  projectId?: string;        // ID или slug проекта
  userId?: string;           // ID пользователя для галереи проектов
  lang?: string;             // ru | en | ka | ar
  containerId?: string;      // ID контейнера (по умолчанию: 'gridix-widget-root')
  theme?: 'light' | 'dark' | 'auto';
  width?: string;            // Ширина виджета (по умолчанию: '100%')
  height?: string;           // Высота виджета (по умолчанию: '600px')
  cssUrl?: string;           // Явный URL к style.css
  inlineStyles?: string;     // Inline CSS как строка (для продвинутого использования)
  compactMode?: boolean;     // Компактный режим
  showHeader?: boolean;      // Показывать заголовок (по умолчанию: true)
  showFilters?: boolean;     // Показывать фильтры (по умолчанию: true)
};
```

## Примеры использования

### Базовый пример

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Gridix Widget Demo</title>
</head>
<body>
  <h1>Наши проекты</h1>
  
  <!-- Контейнер для виджета -->
  <div id="gridix-widget-root"></div>
  
  <!-- Загрузка и инициализация виджета -->
  <script src="https://yoursite.com/widget-inline.js"></script>
  <script>
    GridixWidget.init({
      projectId: 'luxury-apartments-dubai',
      lang: 'ru',
      width: '100%',
      height: '700px'
    });
  </script>
</body>
</html>
```

### Галерея проектов пользователя

```html
<script>
  GridixWidget.init({
    userId: 'user-uuid-here',
    lang: 'en',
    showHeader: true,
    showFilters: true
  });
</script>
```

### Несколько виджетов на странице

```html
<div id="widget-1"></div>
<div id="widget-2"></div>

<script src="https://yoursite.com/widget-inline.js"></script>
<script>
  // Первый виджет
  GridixWidget.init({
    projectId: 'project-1',
    containerId: 'widget-1',
    height: '600px'
  });
  
  // Второй виджет
  GridixWidget.init({
    projectId: 'project-2',
    containerId: 'widget-2',
    height: '600px'
  });
</script>
```

### Параметры через URL

Виджет также поддерживает параметры через URL:

```html
<!-- Для iframe -->
<iframe src="https://yoursite.com/widget.html?projectId=my-project&lang=ru"></iframe>
```

## Технические детали

### Shadow DOM

Виджет создаёт Shadow DOM внутри контейнера:

```
<div id="gridix-widget-root">
  #shadow-root (open)
    <link rel="stylesheet" href="style.css"> <!-- или <style> для inline -->
    <div id="gridix-mount-point">
      <!-- React приложение рендерится здесь -->
    </div>
</div>
```

### Автоматическое определение пути к CSS

Если `cssUrl` не указан, виджет автоматически определяет путь к `style.css`:

1. Ищет тег `<script>` с `widget.js`
2. Заменяет `widget.js` на `style.css`
3. Использует тот же путь и query параметры

**Пример:**
```
script src: https://cdn.example.com/widget.js?v=1.0
css href:   https://cdn.example.com/style.css?v=1.0
```

### Отладка

Виджет выводит полезные console.log сообщения:

```javascript
// Успешная загрузка CSS
GridixWidget: Loading CSS from: https://yoursite.com/style.css
GridixWidget: CSS loaded successfully

// Inline стили
GridixWidget: Inline styles applied

// Ошибки
GridixWidget: Failed to load CSS from: [url]
GridixWidget: Could not determine CSS path. Widget may not render correctly.
```

## Деплой

### На CDN

```bash
# Собрать inline версию
npm run build:widget-inline

# Загрузить на CDN
aws s3 cp dist-widget/widget-inline.js s3://your-bucket/widget.js --cache-control "public, max-age=31536000"
```

### На собственном сервере

```bash
# Nginx конфигурация
location /widget {
    alias /var/www/widget;
    add_header Access-Control-Allow-Origin *;
    add_header Cache-Control "public, max-age=31536000";
}
```

## Решение проблем

### Стили не применяются

1. Проверьте, что CSS файл загружается (см. Network tab в DevTools)
2. Используйте inline версию виджета (`widget-inline.js`)
3. Явно укажите `cssUrl` в параметрах
4. Проверьте CORS заголовки на вашем сервере

### Виджет не отображается

1. Откройте DevTools Console и проверьте ошибки
2. Убедитесь, что контейнер существует до инициализации виджета
3. Проверьте, что Shadow DOM поддерживается браузером (все современные браузеры)

### Конфликты с другими библиотеками

Shadow DOM полностью изолирует виджет, поэтому конфликты маловероятны. Если они возникают:

1. Убедитесь, что вы используете `widget-inline.js`
2. Проверьте, что нет глобальных JavaScript конфликтов
3. Используйте уникальный `containerId`

## Поддержка браузеров

- ✅ Chrome 53+
- ✅ Firefox 63+
- ✅ Safari 10.1+
- ✅ Edge 79+

Shadow DOM поддерживается всеми современными браузерами.

