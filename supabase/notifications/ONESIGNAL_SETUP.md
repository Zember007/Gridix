## OneSignal + Supabase (Email) setup

This project uses Supabase Edge Functions to:
- create/update OneSignal **Users** + **Email subscriptions** on registration
- send transactional emails via OneSignal with templates stored in Postgres
- keep an audit trail (`notification_jobs`) and optional webhook events (`notification_events`)

### Required Supabase secrets (Edge Functions)

Set these secrets in Supabase (Project Settings → Edge Functions → Secrets):
- `ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`

### 1) Auto-create OneSignal email subscription on registration

Create a **Supabase Database Webhook**:
- **Table**: `public.user_profiles`
- **Events**: `INSERT`, `UPDATE`
- **URL**: `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/onesignal-sync-user`
- **Headers**:
  - `x-gridix-webhook-secret: <ONESIGNAL_SYNC_WEBHOOK_SECRET>`
  - `Content-Type: application/json`

Then configure the webhook payload to send (Supabase DB webhooks allow a custom JSON body):

```json
{
  "supabase_user_id": "{{record.id}}",
  "email": "{{record.email}}",
  "enabled": true,
  "locale": "en",
  "tags": {
    "account_type": "{{record.account_type}}"
  }
}
```

If your webhook template syntax differs, map the same fields from the inserted/updated row.

### 2) Send transactional email

Call the Edge Function:
- `POST /functions/v1/notifications-send-email`

Body:

```json
{
  "template_key": "welcome_email",
  "recipient_user_id": "<supabase_user_id>",
  "locale": "en",
  "payload": {
    "user": { "full_name": "John Smith" },
    "app": { "url": "https://gridix.live" }
  }
}
```

### 3) Send task due digest (service-only)

Call the Edge Function:
- `POST /functions/v1/notifications-task-due`

Notes:
- This endpoint is **service-only**: send `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`.
- It uses user preferences (`user_notification_preferences.channel_email` + `notify_task_due`) and user locale (`user_profiles.preferred_locale`, default `en`).

### Template syntax

Templates are stored in `public.notification_templates`:
- `{{path.to.value}}` inserts an **HTML-escaped** value.
- `{{{path.to.value}}}` inserts a **raw** (unsafe) value.

