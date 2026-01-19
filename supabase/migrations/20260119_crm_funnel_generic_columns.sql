-- Generic CRM funnel/stage column naming unification (AmoCRM + Bitrix24)
-- 2026-01-19
--
-- Goals:
-- - crm_funnels.amo_funnel_id -> crm_funnel_id (external funnel id: amo pipeline id / bitrix category id)
-- - crm_funnel_stages: rename Amo-specific columns to generic crm_* equivalents
-- - make crm_stage_id TEXT to support Bitrix stage ids (e.g. "C0:NEW") while keeping Amo ids as stringified numbers
--
-- Notes:
-- - We keep crm_funnels.amocrm_pipeline_id as legacy/backward-compat for now.
-- - Existing Bitrix funnels likely had amo_funnel_id NULL; they will get crm_funnel_id populated on next sync.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnels'
      and column_name = 'amo_funnel_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnels'
      and column_name = 'crm_funnel_id'
  ) then
    execute 'alter table public.crm_funnels rename column amo_funnel_id to crm_funnel_id';
  end if;
end$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnel_stages'
      and column_name = 'amocrm_status_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnel_stages'
      and column_name = 'crm_stage_id'
  ) then
    execute 'alter table public.crm_funnel_stages rename column amocrm_status_id to crm_stage_id';
  end if;
end$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnel_stages'
      and column_name = 'amocrm_pipeline_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnel_stages'
      and column_name = 'crm_pipeline_id'
  ) then
    execute 'alter table public.crm_funnel_stages rename column amocrm_pipeline_id to crm_pipeline_id';
  end if;
end$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnel_stages'
      and column_name = 'amo_funnel_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnel_stages'
      and column_name = 'crm_funnel_id'
  ) then
    execute 'alter table public.crm_funnel_stages rename column amo_funnel_id to crm_funnel_id';
  end if;
end$$;

-- Bitrix stage ids are strings; Amo status ids will be stored as text as well (e.g. "123").
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'crm_funnel_stages'
      and column_name = 'crm_stage_id'
  ) then
    execute 'alter table public.crm_funnel_stages alter column crm_stage_id type text using crm_stage_id::text';
  end if;
end$$;

