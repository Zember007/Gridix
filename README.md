# Floorplan Wizard Builder

Система для создания и управления интерактивными планировками недвижимости с поддержкой кастомных доменов.

## Ключевые функции

- 🏢 **Управление проектами**: Создание и редактирование проектов недвижимости
- 🏠 **Интерактивные планировки**: Визуальные планы этажей с квартирами
- 🌐 **Кастомные домены**: Подключение собственных доменов к проектам
- 📊 **Управление лидами**: Интеграция с AmoCRM
- 🎨 **Настройка полей**: Кастомные поля для квартир
- 📱 **Адаптивный дизайн**: Работа на всех устройствах
- 🔌 **Встраиваемый виджет**: Интеграция на любой сайт с полной изоляцией стилей

## Project info

**URL**: https://lovable.dev/projects/2c952242-a330-4eed-983b-11a86698f6af

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2c952242-a330-4eed-983b-11a86698f6af) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2c952242-a330-4eed-983b-11a86698f6af) and click on Share -> Publish.

## Кастомные домены

Приложение поддерживает подключение кастомных доменов для проектов. Клиенты могут подключить свой домен и при заходе на него автоматически попадать на страницу своего проекта.

### Для разработчиков
- Настройка системы: [docs/custom-domains-setup.md](docs/custom-domains-setup.md)

### Для клиентов
1. В админ панели откройте настройки проекта
2. Перейдите на вкладку "Домены" 
3. Добавьте ваш домен
4. Настройте DNS записи согласно инструкции
5. Дождитесь распространения DNS (до 24 часов)

Подробная инструкция: [docs/custom-domains-setup.md](docs/custom-domains-setup.md)

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Встраиваемый виджет

Gridix предоставляет встраиваемый виджет для интеграции интерактивных планировок на любой сайт.

### Изоляция стилей (Shadow DOM)

Виджет использует **Shadow DOM** для полной изоляции стилей. Это означает:

✅ Стили виджета не влияют на стили вашего сайта  
✅ Стили сайта не влияют на виджет  
✅ Виджет выглядит одинаково на любом сайте  
✅ Полная предсказуемость и безопасность  

### Быстрый старт

```html
<!-- Добавьте контейнер на вашу страницу -->
<div id="gridix-widget-root"></div>

<!-- Подключите скрипт виджета -->
<script src="https://gridix.live/widget.js"></script>

<!-- Инициализируйте виджет -->
<script>
  window.GridixWidget.init({
    projectId: "your-project-id",
    lang: "ru",
    width: "100%",
    height: "800px"
  });
</script>
```

### Опции виджета

| Опция | Тип | По умолчанию | Описание |
|-------|-----|--------------|----------|
| `projectId` | string | - | ID или slug проекта |
| `userId` | string | - | ID пользователя (для галереи проектов) |
| `lang` | string | `'ru'` | Язык интерфейса: `ru`, `en`, `ka`, `ar` |
| `theme` | string | `'light'` | Тема: `light`, `dark`, `auto` |
| `width` | string | `'100%'` | Ширина виджета |
| `height` | string | `'600px'` | Высота виджета |
| `containerId` | string | `'gridix-widget-root'` | ID контейнера |
| `compactMode` | boolean | `false` | Компактный режим |
| `showHeader` | boolean | `true` | Показать заголовок |
| `showFilters` | boolean | `true` | Показать фильтры |
| `cssUrl` | string | - | Явный URL для стилей |

### Примеры использования

**Один проект:**
```javascript
window.GridixWidget.init({
  projectId: "05bc347c-e19a-41ba-8d87-1f7001d3329b",
  lang: "ru"
});
```

**Галерея проектов пользователя:**
```javascript
window.GridixWidget.init({
  userId: "user-uuid",
  lang: "en",
  compactMode: true
});
```

**С кастомными стилями:**
```javascript
window.GridixWidget.init({
  projectId: "project-id",
  cssUrl: "https://your-cdn.com/custom-widget-styles.css",
  theme: "dark"
});
```

### Технические детали

Подробная документация по Shadow DOM изоляции: [WIDGET_SHADOW_DOM.md](WIDGET_SHADOW_DOM.md)

### Тестирование

Тестовая страница с демонстрацией изоляции стилей: [public/test.html](public/test.html)

### Браузерная поддержка

- ✅ Chrome 53+
- ✅ Firefox 63+
- ✅ Safari 10+
- ✅ Edge 79+
