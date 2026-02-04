-- Support correction/blocking workflow for agent applications

alter table if exists public.agent_applications
  add column if not exists rejection_reason text null;

alter table if exists public.agent_applications
  drop constraint if exists agent_applications_status_check;

alter table if exists public.agent_applications
  add constraint agent_applications_status_check
  check (status = any (array['pending','approved','rejected','blocked','needs_correction']));

