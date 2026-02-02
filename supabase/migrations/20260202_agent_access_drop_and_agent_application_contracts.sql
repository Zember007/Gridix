-- Drop legacy agent_access and introduce per-contract signing storage.
-- Also adds user_profiles.password_set_at for the agent-cabinet "set password if not set" gate.

begin;

-- Track signed contract snapshots per application (multi-language / multi-template).
create table if not exists public.agent_application_contracts (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.agent_applications(id) on delete cascade,
  template_id bigint null references public.agent_contract_templates(id) on delete set null,
  template_lang text null,
  contract_template_path text not null,
  signed_contract_path text not null,
  signed_contract_mime text not null,
  signed_at timestamptz not null default now(),
  signature_path text not null,
  signature_meta jsonb null,
  created_at timestamptz not null default now(),
  constraint agent_application_contracts_app_tpl_path_uniq unique (application_id, contract_template_path)
);

create index if not exists agent_application_contracts_application_id_idx
  on public.agent_application_contracts (application_id);

-- Agent-cabinet gate: if null -> show "set password" UI.
alter table public.user_profiles
  add column if not exists password_set_at timestamptz null;

-- Legacy: explicit access table is no longer needed (agents access all developer projects).
drop table if exists public.agent_access cascade;

commit;

