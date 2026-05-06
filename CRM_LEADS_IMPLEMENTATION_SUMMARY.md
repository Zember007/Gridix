# CRM Leads Implementation Summary

Дата: 2026-05-06

## Что реализовано

### 1. Цена лида стала самостоятельной

- В типах и UI добавлено поле `leads.price`.
- При чтении CRM-листинга цена теперь берется из самого лида, а не из привязанного объекта.
- Если у старого лида цены нет, UI может fallback-нуть к цене объекта, чтобы старые данные не выглядели пустыми до backfill.
- Цена лида редактируется в drawer и больше не меняет `apartments.price`.

### 2. Лид может существовать без объекта

- В типах `apartment_id` у лида сделан nullable.
- Создание лида в CRM больше не требует первой квартиры проекта.
- В глобальном CRM-view добавлен выбор проекта при создании пустого лида.
- Если вкладка открыта в контексте проекта, проект подставляется автоматически.
- Привязка объекта остается optional-контекстом, а не обязательной основой CRM-карточки.

### 3. Создание и редактирование лидов

- `CreateLeadModal` теперь передает `project_id`, `price`, `source`, `tags`.
- `useAdminLeadsData.handleCreateLead` создает пустой лид с проектом, ценой и без `apartment_id`.
- Если при создании передан объект, цена копируется из объекта только когда цена лида не задана вручную.
- `handleUpdateLead` поддерживает `name`, `email`, `phone`, `notes`, `price`, `source`, `assigned_to_user_id`, `apartment_id`.
- Смена статуса/стадии продолжает идти через `pipeline_stage_id`.

### 4. Ответственные и задачи

- В CRM вместо постоянных mock-пользователей загружается список: владелец workspace + активные менеджеры.
- Drawer получил редактирование ответственного за лид.
- Массовое назначение выбранных лидов теперь реально обновляет `assigned_to_user_id`.
- Массовое удаление выбранных лидов теперь реально удаляет лиды.
- Создание задачи теперь сохраняет:
  - `type`
  - `due_date`
  - `due_time`
  - `assigned_to_user_id`
  - `completed`
- Чтение задач восстанавливает:
  - тип задачи
  - время
  - результат
  - ответственного
- Завершение задачи теперь сохраняет `result` в `lead_tasks`.

### 5. UI изменения

- `LeadsManager` прокидывает список проектов и пользователей в модалки/drawer.
- `LeadsManagerModals` прокидывает `projectOptions` и `defaultProjectId` в `CreateLeadModal`.
- `LeadDrawer` показывает и редактирует:
  - цену лида
  - ответственного
  - контактные поля
  - источник
- `TaskComposer` больше не зависит напрямую от `MOCK_USERS`, а получает `users` через props.

### 6. Supabase migration

Создана миграция:

`supabase/migrations/20260506120000_crm_lead_price_and_automation_engine.sql`

Она делает:

- `leads.apartment_id` nullable.
- добавляет `leads.price numeric`.
- backfill `leads.price` из `apartments.price`.
- `bitrix_deal_links.apartment_id` nullable.
- индексы для `leads.pipeline_stage_id` и due automation jobs.
- дедупликацию старых duplicate pending jobs перед unique index.
- unique guard для pending automation jobs по `(lead_id, trigger_id, stage_id)`.
- функции:
  - `crm_jsonb_text_array`
  - `crm_trigger_delay_interval`
  - `crm_enqueue_automation_job`
  - `crm_enqueue_lead_automation_jobs`
  - `crm_run_trigger_action`
  - `crm_run_automation_jobs`
- DB trigger `leads_enqueue_crm_automation_jobs`.

После ошибки применения миграции из-за duplicate pending jobs миграция была исправлена: перед созданием unique index она оставляет самый ранний pending job, а остальные переводит в `cancelled` с `context.cancel_reason = duplicate_pending_job_before_unique_index`.

### 7. CRM automation behavior

DB-backed automation покрывает:

- `on_stage_entry`
- `timer`
- `on_tag_add`

Действия:

- `apartment_status`
- `distribution`
- `task`
- `status_change`
- `edit_field`
- `add_tag`
- `notification`

Для автоматических изменений стадии используется session guard `gridix.crm_automation`, чтобы не запускать бесконечные циклы.

### 8. AmoCRM / Bitrix sync

В Edge Functions обновлена логика, чтобы `price` жил на лиде:

- создание лида из объекта сохраняет `leads.price = apartment.price`;
- AmoCRM payload получает цену из лида;
- Bitrix `OPPORTUNITY` получает цену из лида;
- локальная правка `name`, `pipeline_stage_id`, `price` пушится наружу;
- AmoCRM webhook обновляет локальные `name`, `pipeline_stage_id`, `price`;
- Bitrix webhook обновляет локальные `name`, `pipeline_stage_id`, `price`;
- агентские комиссии теперь предпочитают `lead.price`, а объект используют только как fallback;
- действия с лидами без объекта не должны падать: automation пишет activity и пропускает object-only действие.

Важно: папка `supabase/` игнорируется git-ом в этом репозитории (`.gitignore: /supabase/`), поэтому эти изменения существуют на диске, но не отображаются в обычном `git status`.

## Затронутые tracked файлы

- `apps/main/src/entities/lead/api/leadApi.ts`
- `apps/main/src/entities/lead/queries/useLeads.ts`
- `apps/main/src/entities/lead/ui/LeadDrawer.tsx`
- `apps/main/src/entities/lead/ui/TaskComponents.tsx`
- `apps/main/src/features/admin-leads-manager/ui/LeadsManager.tsx`
- `apps/main/src/features/admin-leads-manager/ui/LeadsManagerDrawer.tsx`
- `apps/main/src/features/admin-leads-manager/ui/LeadsManagerModals.tsx`
- `apps/main/src/features/create-lead/ui/CreateLeadModal.tsx`
- `apps/main/src/hooks/useAdminLeadsData.ts`
- `packages/types/src/database.ts`

## Supabase files changed on disk

- `supabase/migrations/20260506120000_crm_lead_price_and_automation_engine.sql`
- `supabase/functions/amocrm-api/index.ts`
- `supabase/functions/amocrm-webhook-callback/index.ts`
- `supabase/functions/crm-webhook-callback/index.ts`
- `supabase/functions/bitrix-app/index.ts`
- `supabase/functions/create-amocrm-lead/index.ts`
- `supabase/functions/crm-create-lead/index.ts`

## Проверки

- `pnpm --filter @gridix/main typecheck` passed.
- `pnpm --filter @gridix/main lint` passed with existing warnings only.
- `deno check` не выполнен, потому что `deno` не установлен в окружении.
- Миграция была отредактирована после ошибки duplicate pending jobs; ее нужно повторно применить.

## Что важно проверить после применения миграции

- Создание пустого лида без объекта.
- Создание лида из объекта и snapshot цены.
- Ручное изменение цены лида без изменения объекта.
- Создание, назначение, завершение задачи с result.
- Массовое назначение ответственного.
- Смена стадии и запуск `on_stage_entry`.
- Timer automation через `crm-funnel-automation`.
- `on_tag_add` только на новые теги.
- AmoCRM/Bitrix push локальных изменений `name`, `stage`, `price`.
- AmoCRM/Bitrix webhook обновляет `leads.price`, а не `apartments.price`.
