# Phase 0 (Driver migration): архив экспорта Usertour + матрица селекторов

Документ описывал миграцию **Usertour → Driver.js**. **Phase 7:** SDK Usertour удалён из репозитория. Ниже §1–2 сохранены как **архив** ручного экспорта из облака; §3 и далее по-прежнему полезны как матрица CSS-якорей (`*_usertour`).

Связанные материалы:

- [USERTOUR_CONTENT_PLAN_RU.md](./USERTOUR_CONTENT_PLAN_RU.md) — каноничные **RU** заголовки/тексты шагов и привязки к селекторам.
- [usertour-checklist-events.md](./usertour-checklist-events.md) — события прогресса чеклистов (`gridix_*`).
- Код (актуально): `apps/main/src/features/onboarding/driver/*`, `packages/utils/src/integrations/onboardingMilestones.ts`, триггеры в `useAdminDashboardTours.ts`, `ProjectEditor.tsx`, `PartnerProgram.tsx`.

---

## 1. Идентификаторы контента (архив, до Phase 7)

### 1.1 Flow-туры: бывшие content ID (RU / non-RU)

Раньше в удалённом `usertour.ts` были зафиксированы пары ID для **ru** vs **остальные** (через `i18n.resolvedLanguage`):

| Сценарий              | RU (`ru`)                   | Non-RU (`nonRu`)            |
| --------------------- | --------------------------- | --------------------------- |
| Admin main onboarding | `cmkcdaumb02t8a6t6f333mcva` | `cmkqppnk50f13a6t6nbbmxw75` |
| Project creation      | `cmkdvb55y047exqpewbq40e7n` | `cmkqt5rdq0f43a6t6wxxiz7dd` |
| Project editor        | `cmkdzv67404dpxqpe9nubbaq0` | `cmkqpp8yb0f06a6t6jjub9jyq` |

**Ручной экспорт из Usertour:** для каждого из шести ID открыть опубликованный flow и зафиксировать порядок шагов, тексты **всех локалей**, кнопки, условия показа, кастомные действия (в т.ч. `document.querySelector(...).click()`), «продолжить по клику».

### 1.2 Partners tour (архив)

- Раньше: переменная `VITE_USERTOUR_PARTNERS_CONTENT_ID` в `.env` / Usertour UI.

### 1.3 Checklists (архив: hosted в Usertour)

- Раньше: `VITE_USERTOUR_ADMIN_CHECKLIST_CONTENT_ID`, `VITE_USERTOUR_PROJECT_CHECKLIST_CONTENT_ID`.

Для исторического Phase 0: экспорт списка пунктов и правил из Usertour. Сейчас чеклисты — в приложении (`trackOnboardingMilestone`, панели в `apps/main`), см. [usertour-checklist-events.md](./usertour-checklist-events.md) и §4.

---

## 2. Чеклист ручного экспорта из Usertour (обязательно)

Выполнить в UI Usertour (или официальным экспортом, если доступен) **до** переноса шагов в Driver:

1. **Admin main** — оба языковых flow (RU + non-RU), см. таблицу §1.1.
2. **Project creation** — оба flow + отдельно ветки/шаги, завязанные на Excel (включая скрипты кликов по `.excel_project_type_building_usertour`, `.excelcol_*_usertour`).
3. **Project editor** — оба flow.
4. **Partners** — flow по `VITE_USERTOUR_PARTNERS_CONTENT_ID`.
5. **Admin checklist** и **Project checklist** — по ENV ID из §1.3.
6. Зафиксировать любые **EN/AR/HE/KA/TR** тексты, если в Usertour они отличаются от дублирования RU; в репозитории полный набор нелокализованных строк туров **не** хранится (есть RU-план в `USERTOUR_CONTENT_PLAN_RU.md`).

Итог Phase 0 вручную: таблица «шаг № → selector → заголовок/текст (по локали) → тип кнопки / click target → условие пропуска».

---

## 3. Матрица селекторов из репозитория

Соглашение: в Usertour/Driver использовать селекторы вида **`.className`** (класс на DOM-элементе).

### 3.1 Админский сайдбар (`SidebarButton`: `${id}_usertour`)

Источник ID: `getAdminNavItems` в `apps/main/src/shared/ui/sidebar-component.tsx`. Класс = **`{id}_usertour`**.

| Селектор                  | Элемент / роль                | Заметки                                        |
| ------------------------- | ----------------------------- | ---------------------------------------------- |
| `.sidebar_usertour`       | Корень `<aside>` сайдбара     | `packages/ui/src/admin-simplified-sidebar.tsx` |
| `.projects_usertour`      | Пункт «Проекты»               | `id: "projects"`                               |
| `.crm_usertour`           | Родитель CRM (раскрывающийся) | Только если не `amoWidget`                     |
| `.leads_usertour`         | Подпункт «Лиды»               | Child of `crm`                                 |
| `.contacts_usertour`      | Подпункт «Контакты»           | Child of `crm`                                 |
| `.agent_network_usertour` | Подпункт «Агентская сеть»     | Child of `crm`                                 |
| `.subscription_usertour`  | Подписка                      | Скрыто для менеджера                           |
| `.widgets_usertour`       | Виджеты                       |                                                |
| `.integrations_usertour`  | Интеграции (админка)          |                                                |
| `.analytics_usertour`     | Аналитика                     |                                                |
| `.settings_usertour`      | Настройки                     | Скрыто для менеджера                           |
| `.partners_usertour`      | Партнёрка                     |                                                |
| `.support_usertour`       | Плавающая кнопка поддержки    | `admin-simplified-sidebar.tsx`                 |

**Условная видимость:** при `amoWidget === true` блок CRM (и классы `.crm_usertour`, `.leads_usertour`, …) **не рендерятся** — шаги тура «Лиды» должны пропускаться (как в `USERTOUR_CONTENT_PLAN_RU.md`).

### 3.2 Дашборд проектов

| Селектор                   | Файл (ориентир)                                                       |
| -------------------------- | --------------------------------------------------------------------- |
| `.projects_list_usertour`  | `apps/main/src/features/admin-dashboard/ui/AdminDashboardContent.tsx` |
| `.create_project_usertour` | `apps/main/src/components/projects/ProjectList.tsx` (кнопки создания) |
| `.project_card_usertour`   | Карточка проекта в списке                                             |
| `.edit_project_usertour`   | Кнопка «редактировать» на карточке                                    |

### 3.3 Модалка создания проекта

| Селектор                            | Файл                                         |
| ----------------------------------- | -------------------------------------------- |
| `.project_creation_modal_usertour`  | `ProjectCreationModal.tsx` — `DialogContent` |
| `.project_manual_create_usertour`   | Карточка ручного создания                    |
| `.project_import_excel_usertour`    | Карточка импорта Excel                       |
| `.project_import_file_tab_usertour` | Таб «файл»                                   |
| `.project_import_url_tab_usertour`  | Таб «по ссылке»                              |
| `.project_import_upload_usertour`   | Зона загрузки файла                          |
| `.project_import_template_usertour` | Кнопка шаблона                               |
| `.project_import_demo_usertour`     | Кнопка демо-файла                            |

### 3.4 Excel column mapper (`ExcelColumnMapper.tsx`)

**Статические классы:**

| Селектор                                | Назначение                                                               |
| --------------------------------------- | ------------------------------------------------------------------------ |
| `.excel_project_name_usertour`          | Input названия проекта                                                   |
| `.excel_project_type_usertour`          | `SelectTrigger` типа проекта                                             |
| `.excel_project_type_building_usertour` | Опция «Здание» (клик из Usertour: `document.querySelector(...).click()`) |
| `.excel_project_description_usertour`   | Описание                                                                 |
| `.excel_mapping_required_usertour`      | Карточка блока сопоставления колонок                                     |
| `.excel_validation_usertour`            | Карточка валидации статусов/комнат                                       |
| `.excel_create_project_usertour`        | Кнопка завершения создания проекта                                       |

**Динамические классы маппинга полей:** для каждого ключа в `allFields` (базовые поля + кастомные):

- Селектор триггера: **`.excel_mapping_<fieldKey>_usertour`**
- Базовые ключи из `ColumnMapping`: `apartmentNumber`, `floor`, `rooms`, `area`, `price`, `status` (набор полей в UI зависит от `projectData.type` и `fieldLabels` — для `object` поле `floor` убирается из подписей).

**Динамические классы опций колонок Excel:** функция `toColumnClass(columnName)`:

- Формула: `excelcol_` + нормализация имени колонки (trim, lower case, не-буквы/цифры → `_`, trim `_`) + `_usertour`.
- Пример из контент-плана: колонка **Number** → `.excelcol_number_usertour`, **Count room** → `.excelcol_count_room_usertour`, **Price Full** → `.excelcol_price_full_usertour`.

Любая новая колонка в файле пользователя получает свой `.excelcol_*_usertour`; шаги тура должны либо целиться в конкретный заголовок демо-файла, либо использовать условную логику в Driver.

### 3.5 Редактор проекта

| Селектор                           | Файл / роль                 |
| ---------------------------------- | --------------------------- |
| `.project_back_usertour`           | `ProjectEditor.tsx` — назад |
| `.project_save_usertour`           | Сохранить                   |
| `.project_editor_content_usertour` | Область контента            |

**Сайдбар редактора:** те же правила `SidebarButton`, ID из `getProjectEditorNavItems`:

| Селектор               | Секция (id)  | Примечание                                        |
| ---------------------- | ------------ | ------------------------------------------------- |
| `.general_usertour`    | `general`    |                                                   |
| `.apartments_usertour` | `apartments` | Подпись зависит от `project_type`                 |
| `.floorplan_usertour`  | `floorplan`  | **Не рендерится** для `project_type === "object"` |
| `.photos_usertour`     | `photos`     |                                                   |
| `.fields_usertour`     | `fields`     |                                                   |
| `.domains_usertour`    | `domains`    |                                                   |

**Расхождение с `USERTOUR_CONTENT_PLAN_RU.md`:** в плане указан шаг с привязкой **`.integrations_usertour`** в редакторе проекта. В текущем `getProjectEditorNavItems` пункта **integrations** нет — класс `.integrations_usertour` есть только в **админском** сайдбаре. При миграции: либо убрать шаг из flow, либо добавить пункт в редактор (продуктовое решение).

### 3.6 Партнёрская программа (`packages/partner-program`)

| Селектор                              | Компонент                                                    |
| ------------------------------------- | ------------------------------------------------------------ |
| `.partners_become_usertour`           | CTA «стать партнёром»                                        |
| `.partners_overview_tab_usertour`     | Таб «Обзор»                                                  |
| `.partners_referrals_tab_usertour`    | Таб «Рефералы»                                               |
| `.partners_clients_tab_usertour`      | Таб «Клиенты»                                                |
| `.partners_instructions_tab_usertour` | Таб «Инструкции» (есть в коде, не описан в RU контент-плане) |
| `.partners_account_tab_usertour`      | Таб «Счёт»                                                   |
| `.partners_copy_link_usertour`        | `PartnerReferralsSection.tsx`                                |
| `.partners_utm_toggle_usertour`       | Переключатель UTM                                            |

### 3.7 Ожидание DOM перед стартом админ-тура

`useAdminDashboardTours.ts` ждёт появления:

`.sidebar_usertour`, `.projects_list_usertour`, `.create_project_usertour`, `.support_usertour`

---

## 4. События `trackOnboardingMilestone` (чеклисты)

Документированы в [usertour-checklist-events.md](./usertour-checklist-events.md). Дополнительно в коде есть события, **не** перечисленные в том файле:

| Событие                           | Файл (ориентир)                   |
| --------------------------------- | --------------------------------- |
| `gridix_billing_checkout_started` | `useSubscriptionTabController.ts` |
| `gridix_billing_plan_changed`     | `useSubscriptionTabController.ts` |

Остальные (`gridix_project_created`, `gridix_billing_invoice_requested`, `gridix_crm_connected`, `gridix_project_basic_info_ready`, `gridix_project_facade_configured`, `gridix_project_first_apartment_created`, `gridix_project_floorplan_uploaded`) — см. чеклист-док и grep по `trackUsertourEvent`.

**Один `onceKey` на Amo и Bitrix:** `gridix_crm_connected` — учитывать при проектировании прогресса после миграции.

---

## 5. Сводка: что уже «экспортировано» в репо vs что только в Usertour

| Артефакт                      | В репозитории                                       | Только Usertour / ENV       |
| ----------------------------- | --------------------------------------------------- | --------------------------- |
| RU тексты шагов основных flow | `USERTOUR_CONTENT_PLAN_RU.md`                       | Сверка с live (расхождения) |
| Non-RU тексты туров           | Нет                                                 | Экспорт из Usertour         |
| Checklist copy + правила UI   | Частично (события)                                  | Пункты, условия, ссылки     |
| Content ID flow               | Частично (захардкожено + partners/checklists в ENV) | Значения ENV                |
| CSS-якоря                     | Этот документ + grep `*_usertour`                   | —                           |

После заполнения ручного экспорта из §2 рекомендуется приложить к задаче **одну таблицу** (CSV/Markdown): `flow_id` × `step_order` × `selector` × `title` × `body` × `locale` × `primary_action`.

---

## 6. Phase 2 — Admin main onboarding → Driver.js (ручная QA)

После merge ветки с заменой admin main flow на `startAdminMainDriverTour` (`useAdminDashboardTours` → Driver, затем `tryAutoOpenAdminChecklistPanel` для встроенного чеклиста):

| Проверка                                                                                 | Ожидание                                                                                                                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Новый пользователь / чистый `localStorage` ключ `gridix_driver_once:<userId>:admin_main` | Тур стартует после появления якорей `.sidebar_usertour`, `.projects_list_usertour`, `.create_project_usertour`, `.support_usertour`. |
| Повторный вход (тот же пользователь)                                                     | Тур admin main не показывается; встроенная панель чеклиста открывается по `tryAutoOpenAdminChecklistPanel` (см. код).                |
| `?dev_tour=1` или `VITE_DRIVER_DEV_TOUR`                                                 | Тур можно снова запустить (once не пишется в storage).                                                                               |
| RU vs EN (и др. локали)                                                                  | Тексты шагов из `driverOnboarding.json`; шаг «Лиды» только если в DOM есть `.leads_usertour` (не amoWidget).                         |
| amoWidget (нет CRM в сайдбаре)                                                           | Шаг `.leads_usertour` отсутствует в цепочке, остальные шаги идут по порядку.                                                         |
| После завершения / Esc / закрытие                                                        | UI не «залипает»; затем при необходимости открывается встроенный чеклист.                                                            |
| Последний шаг                                                                            | Подсветка `.create_project_usertour`; после «Готово» можно открыть модалку — дальше срабатывает Driver tour создания проекта.        |

Сборка: `pnpm --filter @gridix/main typecheck` и `pnpm --filter @gridix/main lint`.

---

## 7. Phase 4 — Project editor tour → Driver.js (ручная QA)

После замены на `startProjectEditorDriverTour` в `ProjectEditor.tsx`:

| Проверка                                                                      | Ожидание                                                                                                                                                           |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Новый пользователь / чистый ключ `gridix_driver_once:<userId>:project_editor` | Тур стартует при открытии **существующего** проекта (`!isNew`, есть `project.id`) после якорей `.sidebar_usertour`, `.general_usertour`, `.project_save_usertour`. |
| Повторный вход в тот же проект                                                | Тур не показывается (once в storage). Встроенный чеклист проекта — `tryAutoOpenProjectChecklistPanel`.                                                             |
| `?dev_tour=1` или `VITE_DRIVER_DEV_TOUR`                                      | Флаг once не пишется — можно снова пройти тур после сброса `startedEditorTourRef` (например смена проекта или перезагрузка страницы).                              |
| Тип проекта «объект» (`project_type === "object"`)                            | Шага `.floorplan_usertour` нет в DOM — он выпадает из цепочки (`filterStepsWithDomTargets`).                                                                       |
| Шаг «Интеграции» из RU-плана                                                  | Не включён: в сайдбаре редактора нет `.integrations_usertour` (только админка).                                                                                    |
| Завершение / Esc                                                              | UI не залипает; overlay Driver снимается.                                                                                                                          |

Сборка: `pnpm --filter @gridix/main typecheck` и `pnpm --filter @gridix/main lint`.

---

## 8. Быстрый grep для ре-валидации матрицы

Из корня репозитория:

```bash
rg "_usertour" apps/main packages/ui packages/partner-program packages/utils --glob "*.{tsx,ts}"
```

Любой новый класс, попавший в выдачу после изменений кода, следует добавить в §3 этого файла.
