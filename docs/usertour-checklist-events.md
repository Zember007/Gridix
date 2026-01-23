# События Usertour checklist (Gridix)

Этот документ содержит список **имен событий**, которые отправляет Gridix для управления **Usertour Checklists**.

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

## Чеклист проекта (примечание: прогресс Usertour привязан к пользователю)

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

## Настройка в Usertour UI

В Usertour:
- Создайте два контента типа **Checklist**:
  - ID контента чеклиста аккаунта → установите `VITE_USERTOUR_ADMIN_CHECKLIST_CONTENT_ID`
  - ID контента чеклиста проекта → установите `VITE_USERTOUR_PROJECT_CHECKLIST_CONTENT_ID`
- Для каждого пункта: в **Mark completed → If** выберите **Attribute** и проверьте, что атрибут с именем события (например `gridix_project_created`) равен `true`.
- При клике на пункт: настройте "**Запустить flow**" (существующие туры) или "**Открыть URL**" (видео).

