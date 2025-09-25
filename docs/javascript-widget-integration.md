# Gridix JavaScript Widget Integration

Система прямого JavaScript встраивания виджетов недвижимости без использования iframe.

## Преимущества JavaScript встраивания

- ✅ **Прямое встраивание в DOM** - виджет становится частью страницы
- ✅ **Полная интеграция со стилями** - CSS стили сайта применяются к виджету
- ✅ **Лучшая производительность** - нет накладных расходов iframe
- ✅ **SEO-дружественность** - контент виджета индексируется поисковыми системами
- ✅ **Адаптивность** - автоматически адаптируется под дизайн сайта
- ✅ **События и взаимодействие** - полная интеграция с JavaScript сайта

## Быстрый старт

### 1. Подключение скрипта

```html
<script src="https://gridix.live/gridix-embed.js"></script>
```

### 2. Автоматическая инициализация

Добавьте div с атрибутами `data-*`:

```html
<!-- Все проекты пользователя -->
<div data-gridix-embed 
     data-user-id="your-user-id"
     data-lang="ru"
     data-theme="default"
     data-show-header="true">
</div>

<!-- Конкретный проект по slug -->
<div data-gridix-embed 
     data-project-slug="luxury-apartments-moscow"
     data-lang="ru"
     data-theme="default"
     data-show-header="true">
</div>

<!-- Конкретный проект по ID -->
<div data-gridix-embed 
     data-project-id="uuid-project-id"
     data-lang="en"
     data-theme="default"
     data-show-header="false">
</div>
```

### 3. Ручная инициализация

```html
<div id="my-widget"></div>

<script src="https://gridix.live/gridix-embed.js"></script>
<script>
new GridixEmbed({
    container: '#my-widget',
    projectSlug: 'luxury-apartments-moscow',
    lang: 'ru',
    theme: 'default',
    showHeader: true
});
</script>
```

## Параметры конфигурации

### Атрибуты для автоматической инициализации

| Атрибут | Описание | Значения | Обязательный |
|---------|----------|----------|--------------|
| `data-gridix-embed` | Маркер для автоинициализации | - | ✅ |
| `data-user-id` | ID пользователя для показа всех проектов | UUID | ⚠️* |
| `data-project-id` | ID конкретного проекта | UUID | ⚠️* |
| `data-project-slug` | Slug конкретного проекта | string | ⚠️* |
| `data-lang` | Язык интерфейса | `ru`, `en`, `uz`, `kz` | ❌ (по умолчанию: `en`) |
| `data-theme` | Тема оформления | `default`, `dark`, `light` | ❌ (по умолчанию: `default`) |
| `data-show-header` | Показывать заголовок виджета | `true`, `false` | ❌ (по умолчанию: `true`) |

*⚠️ Обязательно указать один из: `data-user-id`, `data-project-id`, или `data-project-slug`

### Параметры для ручной инициализации

```javascript
new GridixEmbed({
    container: '#widget-container',    // CSS селектор или DOM элемент
    
    // Источник данных (один из трех):
    userId: 'user-uuid',              // Все проекты пользователя
    projectId: 'project-uuid',        // Конкретный проект по ID
    projectSlug: 'project-slug',      // Конкретный проект по slug
    
    // Опциональные параметры:
    lang: 'ru',                       // Язык интерфейса
    theme: 'default',                 // Тема оформления
    showHeader: true                  // Показывать заголовок
});
```

## Типы виджетов

### 1. Список всех проектов

Показывает все проекты определенного пользователя в виде карточек.

```html
<div data-gridix-embed 
     data-user-id="550e8400-e29b-41d4-a716-446655440000"
     data-lang="ru">
</div>
```

### 2. Детали проекта с квартирами

Показывает конкретный проект со всеми доступными квартирами.

```html
<div data-gridix-embed 
     data-project-slug="residential-complex-moscow"
     data-lang="ru">
</div>
```

## Стилизация

### CSS классы виджета

Виджет использует следующие CSS классы, которые можно переопределить:

```css
/* Основной контейнер */
.gridix-embed-container {
    /* Ваши стили */
}

/* Заголовок виджета */
.gridix-embed-header {
    /* Ваши стили */
}

/* Карточка проекта */
.gridix-project-card {
    /* Ваши стили */
}

/* Карточка квартиры */
.gridix-apartment-card {
    /* Ваши стили */
}

/* Состояния квартир */
.gridix-apartment-card.available { /* Доступна */ }
.gridix-apartment-card.sold { /* Продана */ }
.gridix-apartment-card.reserved { /* Забронирована */ }
```

### Кастомизация темы

```css
/* Переопределение цветов */
.gridix-embed-container {
    --primary-color: #your-brand-color;
    --text-color: #your-text-color;
    --background-color: #your-bg-color;
}
```

## Продвинутые возможности

### Множественные виджеты

```html
<!-- Виджет 1: Все проекты -->
<div data-gridix-embed data-user-id="user-1" data-lang="ru"></div>

<!-- Виджет 2: Конкретный проект -->
<div data-gridix-embed data-project-slug="project-1" data-lang="en"></div>

<script src="https://gridix.live/gridix-embed.js"></script>
```

### Программное управление

```javascript
// Создание виджета
const widget = new GridixEmbed({
    container: '#my-widget',
    projectSlug: 'my-project',
    lang: 'ru'
});

// Обновление данных (пример)
// widget.refresh(); // Если такой метод будет добавлен

// Уничтожение виджета (пример)
// widget.destroy(); // Если такой метод будет добавлен
```

### События (планируется)

```javascript
// Подписка на события виджета
widget.on('projectClick', (project) => {
    console.log('Clicked project:', project);
});

widget.on('apartmentClick', (apartment) => {
    console.log('Clicked apartment:', apartment);
});
```

## API Endpoint

Виджет использует следующий API endpoint для получения данных:

```
GET https://gridix.live/functions/v1/widget-embed-api
```

### Параметры запроса:

- `userId` - ID пользователя (для всех проектов)
- `projectId` - ID проекта (для конкретного проекта)
- `projectSlug` - Slug проекта (для конкретного проекта)
- `lang` - Язык интерфейса (по умолчанию: `ru`)

### Пример ответа:

```json
{
    "success": true,
    "projects": [...],
    "apartments": [...],  // только для одного проекта
    "lang": "ru"
}
```

## Безопасность

- Все запросы к API проходят через CORS
- Показываются только опубликованные проекты (`is_published = true`)
- Персональные данные не передаются в виджет

## Поддержка браузеров

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Производительность

- Минифицированная версия: `gridix-embed.min.js` (~15KB gzipped)
- Ленивая загрузка изображений
- Кэширование API запросов
- Оптимизация для мобильных устройств

## Примеры интеграции

### WordPress

```php
// В functions.php
function add_gridix_widget($atts) {
    $atts = shortcode_atts(array(
        'user_id' => '',
        'project_slug' => '',
        'lang' => 'ru'
    ), $atts);
    
    return '<div data-gridix-embed data-user-id="' . $atts['user_id'] . '" data-lang="' . $atts['lang'] . '"></div>';
}
add_shortcode('gridix_widget', 'add_gridix_widget');

// В footer.php
wp_enqueue_script('gridix-embed', 'https://gridix.live/gridix-embed.js', array(), '1.0', true);
```

### React

```jsx
import { useEffect, useRef } from 'react';

function GridixWidget({ projectSlug, lang = 'ru' }) {
    const containerRef = useRef(null);
    
    useEffect(() => {
        if (containerRef.current) {
            new window.GridixEmbed({
                container: containerRef.current,
                projectSlug,
                lang
            });
        }
    }, [projectSlug, lang]);
    
    return <div ref={containerRef}></div>;
}
```

### Vue.js

```vue
<template>
    <div ref="widgetContainer"></div>
</template>

<script>
export default {
    props: ['projectSlug', 'lang'],
    mounted() {
        new window.GridixEmbed({
            container: this.$refs.widgetContainer,
            projectSlug: this.projectSlug,
            lang: this.lang || 'ru'
        });
    }
}
</script>
```

## Поддержка

Для получения поддержки или сообщения об ошибках:
- Email: support@gridix.live
- Документация: https://gridix.live/docs
- GitHub: https://github.com/gridix/widget-embed
