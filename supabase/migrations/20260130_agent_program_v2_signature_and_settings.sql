-- Agent program v2: settings + signature support + auth linkage

-- agent applications: link to auth user + signature metadata
alter table if exists public.agent_applications
  add column if not exists agent_user_id uuid null references auth.users(id) on delete set null,
  add column if not exists agreement_signed_at timestamptz null,
  add column if not exists signature_path text null,
  add column if not exists signature_method text null,
  add column if not exists signature_meta jsonb not null default '{}'::jsonb;

-- constrain signature_method values
alter table if exists public.agent_applications
  drop constraint if exists agent_applications_signature_method_check;

alter table if exists public.agent_applications
  add constraint agent_applications_signature_method_check
  check (signature_method is null or signature_method = any (array['draw','upload']));

-- prevent duplicate applications per developer per auth-agent
create unique index if not exists agent_applications_developer_agent_user_uidx
  on public.agent_applications (developer_user_id, agent_user_id)
  where developer_user_id is not null and agent_user_id is not null;

-- settings for agent program per developer
create table if not exists public.agent_program_settings (
  developer_user_id uuid primary key references auth.users(id) on delete cascade,
  default_commission_rate numeric not null default 4,
  lead_lock_days integer not null default 30,
  payout_terms text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- helpful indexes for lead lock queries
create index if not exists leads_project_email_created_at_idx
  on public.leads (project_id, email, created_at desc);

create index if not exists leads_project_phone_created_at_idx
  on public.leads (project_id, phone, created_at desc);

create index if not exists projects_user_id_idx
  on public.projects (user_id);

