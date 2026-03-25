# События onboarding checklist (Gridix)

Документ описывает **имена событий** (`eventName` / `onceKey`), которые приложение использует для **встроенного чеклиста** в админке и редакторе проекта. Код вызывает `trackOnboardingMilestone` (алиас `emitOnboardingProgress`) из `@gridix/utils/integrations`.

## Чеклист аккаунта

- **Создать первый проект**: `gridix_project_created`
  - Отправляется после создания проекта:
    - Ручное создание в редакторе проекта (`projects.insert`)
    - Создание через импорт Excel (`useProjectCRUD().createProject`)

- **Заполнить billing / запросить счёт**: `gridix_billing_invoice_requested`
  - Отправляется после успешного запроса счёта во вкладке Subscription.

- **Подключить первую CRM интеграцию**: `gridix_crm_connected`
  - Отправляется, когда любая CRM становится подключенной:
    - AmoCRM авторизован (токен присутствует и не истёк)
    - Bitrix24 подключение существует

## Чеклист проекта

- **Базовая информация заполнена**: `gridix_project_basic_info_ready`
  - Отправляется, когда все поля заполнены:
    - `address` (не пустое)
    - `latitude` (число)
    - `longitude` (число)
    - `pdf_presentation_url` (строка)

- **План фасада настроен**: `gridix_project_facade_configured`
  - Отправляется, когда:
    - `projects.building_image_url` установлен
    - И есть хотя бы один полигон `building_floors` с точками

- **Первый апартамент создан**: `gridix_project_first_apartment_created`
  - Отправляется, когда первая запись `apartments` вставлена для проекта.

- **План этажа загружен**: `gridix_project_floorplan_uploaded`
  - Отправляется, когда `floor_plans.image_url` загружен (вставка или обновление).

## UI в приложении

- Аккаунт: плавающая панель `AdminOnboardingChecklistPanel` после основного тура дашборда (`tryAutoOpenAdminChecklistPanel`).
- Проект: `ProjectOnboardingChecklistPanel` в редакторе (`tryAutoOpenProjectChecklistPanel`).
- Прогресс хранится в `localStorage` с ключами `usertour_once:<onceKey>` (префикс исторический, совместимость с ранними релизами).

## Дополнительные события (аналитика чеклиста)

В коде также эмитятся (с `onceKey`): `gridix_billing_plan_changed`, `gridix_billing_checkout_started` — при необходимости расширения панели чеклиста сверять с `useSubscriptionTabController`.
