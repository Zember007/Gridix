-- Snapshot of filled contract at signing time (agents)
-- We keep a copy so template updates do NOT require re-sign.

alter table if exists public.agent_applications
  add column if not exists contract_template_path text null,
  add column if not exists signed_contract_path text null,
  add column if not exists signed_contract_mime text null,
  add column if not exists signed_contract_created_at timestamptz null;

