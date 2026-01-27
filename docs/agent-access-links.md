# Agent access links integration (Developer → Agent, no agent кабинеты)

Документ описывает интеграцию логики “агентов/партнёров” из `gridix-visual` в `gridix-app` **в изменённом виде**: без кабинетов агентств/агентов, только через ссылки, доступы застройщика и привязку лида к агенту.

---

## 1) Что уже есть в `gridix-visual` (референс логики)

### 1.1 Public routing через query-параметры (static-hosting friendly)
В `gridix-visual/App.tsx` публичные режимы включаются по query:
- `?form=lead-lock` → публичная форма фиксации лида (`PublicLeadFormPage`)
- `?agent_profile` → публичный профиль агента (`PublicAgentPage`)
- `?collection=...`, `?object_id=...` и т.д.

Это важно как паттерн: **публичные сценарии не требуют полноценного роутинга на сервере**, всё определяется параметрами URL.

### 1.2 “Lead Lock Protocol” (фиксация лида + partner info)
В `gridix-visual/features/leads/utils/leadStorage.ts` есть точка входа:
- `addLeadToDeveloperCRM(client, project, agentProfile?)`
- создаёт лид и **вкладывает партнёрскую информацию** в объект `partner` (внутри `ExtendedLead`).

В `gridix-visual/features/public-form/pages/PublicLeadFormPage.tsx` эта логика используется в публичной форме “Фиксация клиента”:
- агент вводит свои данные + данные клиента
- выбирает проект
- создаётся лид у застройщика (в демо — через localStorage)

### 1.3 “Приглашение партнёров” (генерация ссылок)
В `gridix-visual/features/crm-developer/components/PartnerInviteModal.tsx` есть генерация ссылок (через query):
- invite link: `/?action=join_partner&ref=...`
- lead form link: `/?form=lead-lock&developer_id=...`

**Итого:** `gridix-visual` уже демонстрирует 2 ключевые вещи: публичные формы по ссылке и привязку лида к партнёру/агенту.

---

## 2) Целевая логика для `gridix-app` (как ты описал)

### Пользовательские шаги (E2E)
- **Шаг A (создание приглашения):** застройщик генерирует ссылку приглашения для агента и отправляет агенту.
- **Шаг B (анкета агента):** агент открывает ссылку → видит форму → заполняет данные (включая банковские реквизиты для выплат).
- **Шаг C (модерация):** застройщик видит заявки агентов у себя в админке, одобряет конкретную заявку.
- **Шаг D (доступ по ссылке):** агент получает email со ссылкой доступа вида:
  - `/en/projects/agent/:id_agent`
- **Шаг E (выбор проекта):** по ссылке агент видит только проекты, к которым застройщик дал доступ этому агенту.
- **Шаг F (переход в проект):** при выборе проекта открывается обычная публичная страница проекта:
  - `/:lang/project/:projectSlug?agent_id=<id_agent>`
- **Шаг G (persist):** `agent_id` сразу сохраняется в `localStorage` **в разрезе проекта**, чтобы не терялся при перезагрузке.
- **Шаг H (создание лида):** при отправке заявки на бронирование (форма `ApartmentReservationForm`) лид создаётся и **привязывается к агенту**.

---

## 3) Контракты URL / маршруты в `gridix-app`

`gridix-app` уже использует `react-router` и публичные роуты в `src/app/router/PublicRoutes.tsx`.

### 3.1 Новый публичный маршрут “Agent projects”
Добавить в `PublicRoutes` маршрут:
- `/:lang/projects/agent/:agentId`

Назначение: показать список проектов, доступных агенту (`agentId`), и дать кнопку “Открыть проект” → редиректить на `/:lang/project/:projectSlug?agent_id=:agentId`.

> Почему не через query как в `gridix-visual`?  
> Потому что в `gridix-app` уже используется нормальный роутинг вида `/:lang/...`, и этот путь хорошо ложится на структуру.

### 3.2 Query параметр в проекте
В публичном проекте (страница `ProjectWidgetPage` + фактический рендер `ProjectApartmentSelector`) **ничего не ломаем**:
- просто добавляем поддержку `agent_id` как ещё одного query-параметра, аналогично тому, как уже используется `crm`/`deal_id` для Bitrix (`ApartmentDetailsPage` уже парсит `location.search`).

---

## 4) Правило сохранения `agent_id` в localStorage (per project)

Требование: `agent_id` не должен “протекать” между проектами.

### 4.1 Рекомендуемый ключ
- `agent_context:<projectId>` → значение: JSON

Пример значения:

```json
{
  "agent_id": "agent_123",
  "set_at": "2026-01-27T12:00:00.000Z",
  "source": "link"
}
```

### 4.2 Алгоритм при входе в проект
В точке входа в проект (лучше всего — внутри `ProjectApartmentSelector`, потому что туда попадает `projectId`):
1. Прочитать `agent_id` из `location.search`.
2. Если есть:
   - записать `agent_context:<projectId>`
3. Если нет:
   - попытаться прочитать `agent_context:<projectId>` и использовать его как “текущий агент” для лида.

### 4.3 Почему именно `ProjectApartmentSelector`
В `ProjectApartmentSelector` уже есть:
- гарантированный `projectId`
- работа с URL (он сохраняет query params при открытии квартиры через `pushState`)

То есть `agent_id` будет автоматически протаскиваться и на страницы квартиры/бронирования, если не удалять query.

---

## 5) Привязка лида к агенту (важнейшая часть)

В `gridix-app` лид с публичной страницы создаётся через Edge Function:
- UI: `src/components/apartment/ApartmentReservationForm.tsx`
- backend: `supabase/functions/crm-create-lead/index.ts`
- DB: таблица `leads` (уже используется повсеместно)

### 5.1 Что нужно добавить в payload с фронта
Расширить вызов `crm-create-lead` дополнительным параметром:
- `agentId?: string`

Источник значения:
- `agent_id` из query **или** значение из `localStorage` (`agent_context:<projectId>`).

### 5.2 Что должно сохраниться в БД
Есть 2 варианта (выбери один как продуктовый стандарт).

**Вариант A (минимальные изменения): добавить колонку в `leads`**
- `leads.agent_id text null` (или `uuid`, если `agents.id` будет `uuid`)
- опционально: `agent_name`, `agent_email`, `agent_phone` (если нужно быстро видеть без join)

**Вариант B (нормализованно): отдельная таблица “lead_agents / referrals”**
- `lead_referrals`:
  - `lead_id`
  - `agent_id`
  - `project_id`
  - `created_at`
  - `source` (например `link`)

Для MVP под твою схему чаще выбирают **Вариант A**, чтобы быстрее показать привязку в CRM.

### 5.3 Логика в `crm-create-lead`
В `supabase/functions/crm-create-lead/index.ts` сейчас формируется payload для вставки в `leads`:
- `name/email/phone/project_id/apartment_id/source/pipeline_stage_id`

Нужно:
- принять `agentId` из request body
- провалидировать его (минимум: строка, не пустая)
- сохранить в локальный лид (в тот же `insert` payload)
- при отправке в Amo/Bitrix (если нужно) — **добавить кастомное поле/комментарий**, чтобы в CRM было видно “лид от агента X”.

> Важно: сейчас `crm-create-lead` создаёт **несколько** локальных лидов (по одному на каждый funnel/integration).  
> Значит `agent_id` должен записываться во все созданные записи, чтобы не потерять связь.

---

## 6) Админка застройщика: заявки агентов и “одобрить”

В `gridix-app` админка живёт под `/:lang/admin/*` и авторизация через Supabase (`AuthContext`).

Твоя схема требует сущности “Agent application” и управления доступом к проектам.

### 6.1 Минимальные таблицы (предложение)

**`agent_applications`** (заявка)
- `id`
- `developer_user_id` (застройщик-владелец проектов, `projects.user_id`)
- `status` (`pending` | `approved` | `rejected`)
- `full_name`
- `email`
- `phone`
- `bank_details` (JSONB, зашифровать на стороне БД/хранилища если нужно)
- `created_at`, `reviewed_at`

**`agent_access`** (доступ агента к проектам)
- `id`
- `agent_id` (или `agent_application_id` как MVP)
- `project_id`
- `created_at`

### 6.2 Ссылки

**Ссылка приглашения (анкета):**
- `/en/agent/apply?developer_id=<developer_user_id>&invite=<invite_token>`

**Ссылка доступа (после одобрения):**
- `/en/projects/agent/<agent_id>`

> Рекомендация по безопасности: вместо “голого” `agent_id` лучше использовать **непредсказуемый токен** (UUID/ULID) или подписанный JWT, чтобы ссылку нельзя было перебором угадать.

### 6.3 Email-отправка
После одобрения админкой:
- отправить email агенту со ссылкой `/en/projects/agent/<agent_id_or_token>`

В `gridix-app` уже есть паттерн “обработка приглашений” через `InvitationHandlerPage` и edge function `partner-program`.  
Можно сделать аналогичный edge function, например:
- `supabase/functions/agent-program`:
  - `create_invite`
  - `submit_application`
  - `approve_application` (и отправка email)
  - `list_agent_projects` (для страницы `/projects/agent/:id`)

---

## 7) Что нужно добавить в `gridix-app` по файлам (чеклист интеграции)

### Frontend
- `src/app/router/PublicRoutes.tsx`
  - добавить route `projects/agent/:agentId`
- Новая страница:
  - `src/pages/AgentProjectsPage.tsx` (список проектов агента)
- Новая страница (анкета агента):
  - `src/pages/AgentApplicationPage.tsx` (форма: ФИО/телефон/email/банковские реквизиты)
- `src/components/project-selector/ProjectApartmentSelector.tsx`
  - при наличии `agent_id` в query — записывать `agent_context:<projectId>`
- `src/components/apartment/ApartmentReservationForm.tsx`
  - передавать `agentId` в `crm-create-lead` (из query или localStorage)

### Backend (Supabase)
- `supabase/functions/crm-create-lead/index.ts`
  - расширить `LeadRequest` полем `agentId?: string`
  - сохранять `agent_id` в локальный `leads` insert payload
- Миграции:
  - либо добавить колонку `agent_id` в `leads`, либо создать таблицу `lead_referrals`
- Новый edge function (предлагается):
  - `agent-program` для invites/applications/access/projects list + email sending

---

## 8) Примечания по совместимости с текущим кодом `gridix-app`

- `ApartmentDetailsPage` уже умеет работать с query (`crm`, `deal_id`). Добавление `agent_id` вписывается без архитектурного конфликта.
- `ProjectApartmentSelector` при открытии квартиры через `pushState` **копирует текущие query params** — это поможет “пронести” `agent_id` внутрь карточек/форм.

---

## 9) Минимальный MVP (если надо быстро запустить)

Если цель — быстро показать end-to-end:
1. Сделать `AgentProjectsPage` + route `/projects/agent/:agentId` (можно сначала со статическими моками).
2. Сохранять `agent_id` per project в localStorage в `ProjectApartmentSelector`.
3. Прокинуть `agentId` в `ApartmentReservationForm` → `crm-create-lead`.
4. В `crm-create-lead` просто писать `agent_id` в `leads` (новая колонка).

Потом уже:
- анкета/заявки/одобрение/email
- project-level access
- отображение агента в CRM UI, отчёты, выплаты

