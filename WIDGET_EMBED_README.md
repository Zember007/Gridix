# Gridix JavaScript Widget Embedding System

Система прямого встраивания виджетов недвижимости через JavaScript без использования iframe.

## 🚀 Быстрый старт

```html
<!-- 1. Подключите скрипт -->
<script src="https://gridix.live/gridix-embed.js"></script>

<!-- 2. Добавьте контейнер для виджета -->
<div data-gridix-embed 
     data-project-slug="your-project-slug"
     data-lang="ru"
     style="width: 100%; min-height: 400px;">
</div>
```

## ✨ Преимущества

- **🎯 Прямое встраивание в DOM** - виджет становится частью страницы
- **🎨 Полная интеграция стилей** - CSS стили сайта применяются к виджету  
- **⚡ Высокая производительность** - нет накладных расходов iframe
- **🔍 SEO-оптимизация** - контент индексируется поисковыми системами
- **📱 Адаптивный дизайн** - автоматически подстраивается под устройство
- **🔧 Легкая кастомизация** - полный контроль над внешним видом

## 📋 Типы виджетов

### 1. Все проекты пользователя
```html
<div data-gridix-embed data-user-id="your-user-id" data-lang="ru"></div>
```

### 2. Конкретный проект (по slug)
```html
<div data-gridix-embed data-project-slug="project-slug" data-lang="ru"></div>
```

### 3. Конкретный проект (по ID)
```html
<div data-gridix-embed data-project-id="project-uuid" data-lang="ru"></div>
```

## ⚙️ Параметры конфигурации

| Параметр | Описание | Значения | По умолчанию |
|----------|----------|----------|--------------|
| `data-user-id` | ID пользователя | UUID | - |
| `data-project-id` | ID проекта | UUID | - |
| `data-project-slug` | Slug проекта | string | - |
| `data-lang` | Язык интерфейса | `ru`, `en`, `uz`, `kz` | `en` |
| `data-theme` | Тема оформления | `default`, `dark`, `light` | `default` |
| `data-show-header` | Показать заголовок | `true`, `false` | `true` |

## 🔧 Ручная инициализация

```javascript
new GridixEmbed({
    container: '#my-widget',
    projectSlug: 'luxury-apartments',
    lang: 'ru',
    theme: 'default',
    showHeader: true
});
```

## 🎨 Кастомизация стилей

```css
/* Основной контейнер */
.gridix-embed-container {
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Карточки проектов */
.gridix-project-card {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Состояния квартир */
.gridix-apartment-card.available {
    border-left-color: #10b981;
}
```

## 📱 Адаптивность

Виджет автоматически адаптируется под размер экрана:
- **Desktop**: Сетка из 3 колонок
- **Tablet**: Сетка из 2 колонок  
- **Mobile**: Одна колонка

## 🌍 Поддерживаемые языки

- 🇷🇺 Русский (`ru`)
- 🇺🇸 Английский (`en`) 
- 🇺🇿 Узбекский (`uz`)
- 🇰🇿 Казахский (`kz`)

## 📊 Примеры использования

### WordPress
```php
// Шорткод для WordPress
[gridix_widget user_id="user-id" lang="ru"]
```

### React
```jsx
function MyWidget() {
    const ref = useRef();
    
    useEffect(() => {
        new GridixEmbed({
            container: ref.current,
            projectSlug: 'my-project'
        });
    }, []);
    
    return <div ref={ref}></div>;
}
```

### Vue.js
```vue
<template>
    <div ref="widget"></div>
</template>

<script>
export default {
    mounted() {
        new GridixEmbed({
            container: this.$refs.widget,
            projectSlug: this.projectSlug
        });
    }
}
</script>
```

## 🔗 API Endpoint

```
GET https://gridix.live/functions/v1/widget-embed-api
```

Параметры:
- `userId` - для всех проектов пользователя
- `projectId` или `projectSlug` - для конкретного проекта
- `lang` - язык интерфейса

## 📦 Размер и производительность

- **Основной файл**: `gridix-embed.js` (~25KB)
- **Минифицированный**: `gridix-embed.min.js` (~15KB gzipped)
- **Время загрузки**: < 100ms
- **Поддержка кэширования**: ✅

## 🛠️ Техническая поддержка

- **Email**: support@gridix.live
- **Документация**: [docs/javascript-widget-integration.md](docs/javascript-widget-integration.md)
- **Демо**: https://gridix.live/widget-demo.html

## 📋 Changelog

### v1.0.0
- ✅ Прямое встраивание в DOM без iframe
- ✅ Автоматическая и ручная инициализация
- ✅ Поддержка множественных виджетов
- ✅ Адаптивный дизайн
- ✅ Мультиязычность
- ✅ API для получения данных проектов
