---
name: agent-signature-pdf-contracts-admin-theme
overview: Сохраняем подпись агента глобально, убираем скачивание PDF-скрином, сохраняем и показываем подписанные договоры, и приводим карточку агента к i18n + admin-теме (без голубых).
todos:
  - id: db-migration-user-profiles-signature
    content: Добавить signature_* поля в public.user_profiles (миграция)
    status: completed
  - id: edge-agent-program-signature-contracts
    content: "Доработать agent-program: вернуть подпись в verify_auth_user_password; сохранять подпись глобально; сохранять/выдавать signed contracts; добавить list_application_signed_contracts"
    status: completed
  - id: ui-agent-application-signature-reuse
    content: "AgentApplicationPage: подтягивать сохранённую подпись для existing user, пропускать шаг signature"
    status: completed
  - id: ui-agent-application-signed-download
    content: "AgentApplicationPage: убрать html2canvas/jsPDF скачивание; показывать скачивание signed PDF на success"
    status: completed
  - id: admin-partner-drawer-theme-i18n-contracts
    content: "PartnerDrawer: i18n + заменить blue на admin CSS vars + показать подписанные договоры"
    status: completed
  - id: locales-update
    content: Добавить ключи переводов (drawer + статусы) в locales/*/partners.json
    status: completed
  - id: ci-checks
    content: Проверить lint/typecheck/build по workflow CI
    status: completed
isProject: false
---

# Agent signature + signed contracts + admin theme

## Контекст (что сейчас)

- `AgentApplicationPage.tsx` всегда требует подпись и передаёт её как `signature_data_url` в edge function `agent-program` (action `sign_agreements_public`).

```397:410:/Users/georgiiborisov/Documents/Gridix/GRIDIX-Service/gridix-app/apps/main/src/pages/AgentApplicationPage.tsx
// Sign multiple contracts (public flow for invite wizard).
const signResp = await supabase.functions.invoke("agent-program", {
  body: {
    action: "sign_agreements_public",
    application_id: applicationId,
    email: formData.email,
    signature_data_url: finalSignatureDataUrl,
    signature_method: signatureMethod,
    accepted: true,
    contract_template_paths: selectedTemplates.map((t) => t.storage_path),
  },
});
```

- PDF скачивается как “скрин” через `html2canvas` → `jsPDF.addImage`.

```568:603:/Users/georgiiborisov/Documents/Gridix/GRIDIX-Service/gridix-app/apps/main/src/pages/AgentApplicationPage.tsx
const downloadPdf = async () => {
  // ...
  const pdf = new jsPDF({ unit: "px", format: [A4_W, A4_H] });
  for (let p = 0; p < pageCount; p++) {
    const canvas = await html2canvas(exportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff", width: A4_W, height: A4_H });
    const imgData = canvas.toDataURL("image/png");
    if (p > 0) pdf.addPage([A4_W, A4_H], "portrait");
    pdf.addImage(imgData, "PNG", 0, 0, A4_W, A4_H);
  }
  pdf.save(`${safeName}.pdf`);
};
```

- В БД уже есть сущности под multi-contract:
  - `public.agent_application_contracts` (signed_contract_path, signature_path, meta, signed_at)
  - `public.agent_applications` (signature_path/method/meta + signed_contract_path/mime)
- `PartnerDrawer.tsx` частично читает подпись из `agent_applications.signature_path`, но:
  - не показывает список подписанных договоров
  - содержит захардкоженные русские строки
  - много `blue-*` классов.

```136:146:/Users/georgiiborisov/Documents/Gridix/GRIDIX-Service/gridix-app/apps/main/src/components/admin/partners/PartnerDrawer.tsx
<button
  onClick={() => setActiveTab(tab as Tab)}
  className={`py-3 px-4 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
>
```

## Цели по требованиям

1. **Подпись агента** хранится **глобально** (одна на агента) и переиспользуется: если подписи нет — запрашиваем и сохраняем; если есть — пропускаем шаг подписи.
2. **Скачивание PDF**: убираем “скрин-экспорт”; скачивание доступно **только после подписания** и отдаётся как полноценный PDF (из сохранённого signed файла).
3. После подписания **сохраняем подписанные договоры** и **подгружаем/показываем** их в карточке агента у застройщика.
4. `PartnerDrawer.tsx`: **перевод (i18n)** + **цвета из admin-theme-config** (CSS variables), убрать “голубые”.

## План работ

### A) Схема БД (миграция)

- Добавить в `public.user_profiles` поля для глобальной подписи агента:
  - `signature_path text null`
  - `signature_method text null`
  - `signature_meta jsonb not null default '{}'::jsonb`

> Это позволит не привязывать подпись к конкретному `agent_applications`.

### B) Edge Function `agent-program` (Supabase)

- Расширить/добавить действия:
  - `**verify_auth_user_password**`: при `valid=true` вернуть также текущую подпись агента из `user_profiles` (path + public/signed URL, method, meta) — чтобы фронт мог сразу подхватить и пропустить шаг подписи.
  - `**sign_agreements_public**`:
    - гарантировать сохранение подписи агента в `user_profiles.*signature_*` (если пусто — записать; если заполнено — можно оставить как есть или обновлять последней подписью; выберу “обновлять, если пользователь подписывает новой подписью”).
    - гарантировать запись подписанных документов в `agent_application_contracts` (по одному ряду на template) и возврат в ответе массива `{template_lang,name,signed_url,signed_at}`.
  - (для админки) добавить action вида `**list_application_signed_contracts**` (auth required по JWT) → отдаёт список подписанных договоров + signed URLs для скачивания в `PartnerDrawer`.

### C) `AgentApplicationPage.tsx`

- **Подхват подписи для существующего агента**:
  - после успешной проверки пароля (existing user) взять подпись из ответа `verify_auth_user_password` и:
    - если подпись есть — загрузить её в `data:image/...` (fetch blob → FileReader) и проставить `uploadedSignatureDataUrl`/`signatureMethod`.
    - автоматически перевести шаг в `contracts` (пропустить `signature`).
- **Скачивание PDF**:
  - убрать/задизейблить кнопку `Download PDF` в превью.
  - на success-экране показывать список подписанных договоров с кнопками “Download signed PDF” (ссылки берём из ответа `sign_agreements_public`).
  - полностью удалить зависимость от `html2canvas`/`jsPDF` в этом месте (или оставить только для других частей, если используются; по текущему файлу — убрать).

### D) `PartnerDrawer.tsx` (i18n + тема + signed contracts)

- **Перевод**:
  - подключить `useLanguage()` и заменить все RU-строки на `t('partners.drawer.*')`.
  - добавить недостающие ключи статусов сети агентов: `partners.status.active|pending|needsCorrection|blocked` (их уже использует `AgencyPartnersPage`).
- **Тема/цвета**:
  - заменить `border-blue-600 text-blue-600 bg-blue-*` на CSS vars: `border-[var(--admin-primary)] text-[var(--admin-primary)] bg-[var(--admin-background-secondary)]` и т.п.
  - заменить “голубые” индикаторы в блоке договора на `var(--admin-primary)`.
- **Подписанные договоры**:
  - через `agent-program` (action `list_application_signed_contracts`) загрузить список документов для `application_id = partner.id`.
  - отрисовать в табе `settings` секцию “Signed contracts” с:
    - языком/именем шаблона
    - датой подписи
    - кнопкой скачать (signed URL).

### E) Локали

- Обновить файлы:
  - `/Users/georgiiborisov/Documents/Gridix/GRIDIX-Service/gridix-app/apps/main/src/locales/en/partners.json`
  - `/Users/georgiiborisov/Documents/Gridix/GRIDIX-Service/gridix-app/apps/main/src/locales/ru/partners.json`
  - и синхронизировать ключи в `he/ar/ka` (минимум добавить те же ключи; значения можно временно на EN, если принято в проекте).

### F) Проверки

- Прогнать команды как в CI (после чтения `.github/workflows/ci.yml`): lint/typecheck/build через `pnpm turbo run ...`.

## Заметки/допущения

- Подпись агента хранится как PNG в `project-images` (как и сейчас для `agent_applications.signature_path`).
- Signed contracts храним в `project-files` и выдаём **signed URLs** через edge function (не public urls).
