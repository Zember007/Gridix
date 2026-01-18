# Floorplan Wizard Builder

Система для создания и управления интерактивными планировками недвижимости с поддержкой кастомных доменов.

## Ключевые функции

- 🏢 **Управление проектами**: Создание и редактирование проектов недвижимости
- 🏠 **Интерактивные планировки**: Визуальные планы этажей с квартирами
- 🌐 **Кастомные домены**: Подключение собственных доменов к проектам
- 📊 **Управление лидами**: Интеграция с AmoCRM / Bitrix24
- 🎨 **Настройка полей**: Кастомные поля для квартир
- 📱 **Адаптивный дизайн**: Работа на всех устройствах

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

## Bitrix24 integration (dev notes)

See `supabase/functions/bitrix-install/README.md`.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
