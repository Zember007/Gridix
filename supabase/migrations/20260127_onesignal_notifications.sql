-- OneSignal email notifications architecture (templates + outbox + user links)
-- 2026-01-27

-- UUID helper (gen_random_uuid)
create extension if not exists pgcrypto;

-- Enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_channel') then
    create type public.notification_channel as enum ('email');
  end if;
end$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_job_status') then
    create type public.notification_job_status as enum ('queued','sending','sent','failed');
  end if;
end$$;

-- Link Supabase users to OneSignal users/subscriptions
create table if not exists public.onesignal_user_links (
  supabase_user_id uuid primary key references public.user_profiles(id) on delete cascade,
  onesignal_id uuid null,
  email_subscription_id uuid null,
  email text not null,
  enabled boolean not null default true,
  last_synced_at timestamptz null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onesignal_user_links_email_idx
  on public.onesignal_user_links (email);

-- Notification templates (server-side rendering)
create table if not exists public.notification_templates (
  id bigserial primary key,
  key text not null,
  channel public.notification_channel not null,
  locale text not null default 'en',
  subject_template text not null,
  html_template text not null,
  schema jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_templates_key_channel_locale_uniq unique (key, channel, locale)
);

create index if not exists notification_templates_lookup_idx
  on public.notification_templates (key, channel, locale)
  where is_active = true;

-- Outbox/audit of attempted sends
create table if not exists public.notification_jobs (
  id uuid primary key default gen_random_uuid(),
  idempotency_key uuid not null,
  channel public.notification_channel not null default 'email',
  template_key text not null,
  locale text not null default 'en',
  recipient_user_id uuid not null references public.user_profiles(id) on delete cascade,
  recipient_email text null,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_job_status not null default 'queued',
  attempts int not null default 0,
  max_attempts int not null default 5,
  onesignal_message_id text null,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz null,
  constraint notification_jobs_idempotency_key_uniq unique (idempotency_key)
);

create index if not exists notification_jobs_status_created_idx
  on public.notification_jobs (status, created_at desc);

create index if not exists notification_jobs_recipient_idx
  on public.notification_jobs (recipient_user_id, created_at desc);

create index if not exists notification_jobs_onesignal_message_id_idx
  on public.notification_jobs (onesignal_message_id);

-- Optional: store incoming OneSignal webhook events (delivery/bounce/unsubscribe, etc)
create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  job_id uuid null references public.notification_jobs(id) on delete set null,
  onesignal_message_id text null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notification_events_onesignal_message_id_idx
  on public.notification_events (onesignal_message_id, created_at desc);

-- RLS: keep templates/jobs private by default; allow users to view their own job history + link row.
alter table public.onesignal_user_links enable row level security;
alter table public.notification_templates enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.notification_events enable row level security;

do $$
begin
  -- onesignal_user_links: user can view only their row
  begin
    create policy onesignal_user_links_select_own
      on public.onesignal_user_links
      for select
      to authenticated
      using (supabase_user_id = auth.uid());
  exception
    when duplicate_object then null;
  end;

  -- notification_jobs: user can view only jobs addressed to them
  begin
    create policy notification_jobs_select_own
      on public.notification_jobs
      for select
      to authenticated
      using (recipient_user_id = auth.uid());
  exception
    when duplicate_object then null;
  end;
end$$;

