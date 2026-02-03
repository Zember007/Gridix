-- Agent application: person type + partner-like fields
-- Adds:
-- - public.agent_applications: company_name, tax_id, legal_address, constrains type to company|individual
-- - public.user_profiles: person_type (company|individual)

begin;

alter table if exists public.agent_applications
  add column if not exists company_name text null,
  add column if not exists tax_id text null,
  add column if not exists legal_address text null;

alter table if exists public.agent_applications
  drop constraint if exists agent_applications_type_check;

alter table if exists public.agent_applications
  add constraint agent_applications_type_check
  check (type is null or type = any (array['company','individual']));

alter table if exists public.user_profiles
  add column if not exists person_type text null;

alter table if exists public.user_profiles
  drop constraint if exists user_profiles_person_type_check;

alter table if exists public.user_profiles
  add constraint user_profiles_person_type_check
  check (person_type is null or person_type = any (array['company','individual']));

commit;

