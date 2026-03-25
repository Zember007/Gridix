# События onboarding checklist (Gridix)

Документ описывает **имена событий** (`eventName` / `onceKey`), которые приложение использует для **встроенного чеклиста** в админке и редакторе проекта. Код вызывает `trackOnboardingMilestone` (алиас `emitOnboardingProgress`) из `@gridix/utils/integrations`.

## Источник истины в UI: БД + legacy localStorage

Панели чеклиста в `apps/main` считают пункт **выполненным**, если выполняется **хотя бы одно** из условий:

1. **Derived (Supabase)** — фактическое состояние строк в БД по правилам ниже (основной источник для синхронизации между браузерами и после очистки `localStorage`).
2. **Legacy** — `isOnboardingMilestoneCompleted(onceKey)` читает `localStorage` с ключом `usertour_once:<onceKey>` (префикс исторический, совместимость с ранними релизами).

Загрузка derived и повтор при смене вкладки/открытии панели: `onboardingDerivedQueries.ts`, хуки `useAdminOnboardingDerivedProgress` и `useProjectOnboardingDerivedProgress`. Оптимистичные обновления после действий пользователя по-прежнему идут через `trackOnboardingMilestone` → запись в LS и подписчиков (`useOnboardingMilestoneSync` учитывает также `revision` от derived-fetch).

### Область видимости данных

- **Аккаунтный чеклист** (`AdminOnboardingChecklistPanel`): запросы к `projects`, `crm_connections`, `user_subscriptions` фильтруются по **`effectiveOwnerId`** — логическому владельцу кабинета (как в `useAdminDashboardController`: в manager mode это `developerId`, иначе `user.id`). Прокидывается из `AdminDashboardRoot`.
- **Проектный чеклист** (`ProjectOnboardingChecklistPanel`): все проектные проверки строго по **`project_id`** текущего проекта.

`trackOnboardingMilestone` **не привязывает** ключи к `user.id` / `project.id` в LS — поэтому без derived старые клиенты и очищенный LS давали рассинхрон с БД.

## Чеклист аккаунта

- **Создать первый проект**: `gridix_project_created`
  - **Эмит** после создания проекта:
    - Ручное создание в редакторе проекта (`projects.insert`)
    - Создание через импорт Excel (`useProjectCRUD().createProject`)
  - **Derived:** `count(projects)` с `user_id = effectiveOwnerId` > 0.

- **Заполнить billing / запросить счёт** (и родственные аналитические ключи): `gridix_billing_invoice_requested`, а также при необходимости `gridix_billing_checkout_started`, `gridix_billing_plan_changed`
  - **Эмит:** после успешного запроса счёта, при старте checkout, при смене плана — см. `useSubscriptionTabController`.
  - **Derived (один флаг «billing затронут»):** в `user_subscriptions` для `user_id = effectiveOwnerId` есть строка, где заданы `invoice_requested_at` или `invoice_paid_at`, **или** статус `active` / `trialing` и при этом `current_period_end` отсутствует **или** позже «сейчас» (см. `isUserSubscriptionBillingTouched` в `onboardingDerivedQueries.ts`).
  - **Legacy OR:** пункт считается выполненным также, если в LS отмечен любой из `gridix_billing_invoice_requested` / `gridix_billing_checkout_started` / `gridix_billing_plan_changed` — промежуточное «ушёл в Stripe без записи в БД» иначе недеривабельно.

- **Подключить первую CRM интеграцию**: `gridix_crm_connected`
  - **Эмит**, когда любая CRM становится подключенной:
    - AmoCRM: живые `access_token` + `refresh_token` (как `useAmoCRMConnection`)
    - Bitrix24: есть связь (`bitrix_member_id` и/или непустой `refresh_token`)
  - **Derived:** в `crm_connections` для `user_id = effectiveOwnerId` есть строка, удовлетворяющая `isCrmConnectionRowLive` (Amo/Bitrix/прочие — см. модуль).

## Чеклист проекта

- **Базовая информация заполнена**: `gridix_project_basic_info_ready`
  - **Эмит**, когда все поля заполнены:
    - `address` (не пустое)
    - `latitude` / `longitude` (числа)
    - `pdf_presentation_url` (непустая строка)
  - **Derived:** те же предикаты по строке `projects` для данного `project_id`.

- **План фасада настроен**: `gridix_project_facade_configured`
  - **Эмит**, когда:
    - есть изображение фасада (`projects.building_image_url` и/или запись `project_facades` с `image_url`)
    - и есть хотя бы один полигон `building_floors` с непустым массивом точек
  - **Derived:** то же; для **`project_type === 'object'`** этап считается выполненным **автоматически (N/A)** — полигоны на фасаде для типа «объект» могут не использоваться, чтобы не показывать ложное «не готово».

- **Первый апартамент создан**: `gridix_project_first_apartment_created`
  - **Эмит**, когда первая запись `apartments` вставлена для проекта.
  - **Derived:** `count(apartments)` с данным `project_id` > 0.

- **План этажа загружен**: `gridix_project_floorplan_uploaded`
  - **Эмит**, когда у проекта есть `floor_plans` с непустым `image_url`.
  - **Derived:** есть хотя бы одна строка `floor_plans` для `project_id` с непустым `image_url`.
  - **UI:** пункт показывается только для **`project_type === 'building'`** (для `object` в панели нет строки «план этажа»).

## UI в приложении

- Аккаунт: плавающая панель `AdminOnboardingChecklistPanel` после основного тура дашборда (`tryAutoOpenAdminChecklistPanel`).
- Проект: `ProjectOnboardingChecklistPanel` в редакторе (`tryAutoOpenProjectChecklistPanel`).

## Driver.js и чеклист

Туры Driver.js используют отдельное хранилище once-ключей (`gridix_driver_once:<userId>:<tourId>` в `onceStorage.ts`) — **user-scoped**, не путать с ключами чеклиста `usertour_once:<onceKey>`.

## Дополнительные события (аналитика чеклиста)

В коде также эмитятся (с `onceKey`): `gridix_billing_plan_changed`, `gridix_billing_checkout_started` — при расширении панели чеклиста сверять с `useSubscriptionTabController` и с правилом **derived OR legacy** для billing выше.
