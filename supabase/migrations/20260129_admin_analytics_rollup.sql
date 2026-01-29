-- Admin analytics performance: rollups + RPC
-- 2026-01-29

-- Rollup tables (incremental aggregates)
create table if not exists public.project_daily_metrics (
  project_id uuid not null references public.projects(id) on delete cascade,
  day date not null,
  views int not null default 0,
  leads int not null default 0,
  primary key (project_id, day)
);

create index if not exists project_daily_metrics_day_idx
  on public.project_daily_metrics (day);

create table if not exists public.apartment_daily_views (
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  day date not null,
  views int not null default 0,
  primary key (apartment_id, day)
);

create index if not exists apartment_daily_views_day_idx
  on public.apartment_daily_views (day);

-- Fast lookup indexes on source tables (for trigger reads / joins / any fallback queries)
create index if not exists project_views_project_id_created_at_idx
  on public.project_views (project_id, created_at);

create index if not exists leads_project_id_created_at_idx
  on public.leads (project_id, created_at);

create index if not exists apartments_project_id_status_idx
  on public.apartments (project_id, status);

create index if not exists apartment_views_apartment_id_created_at_idx
  on public.apartment_views (apartment_id, created_at);

create index if not exists manager_accounts_lookup_idx
  on public.manager_accounts (manager_id, developer_id, status);

create index if not exists manager_project_access_lookup_idx
  on public.manager_project_access (manager_account_id, project_id);

-- Trigger functions: increment rollups on inserts
create or replace function public.tg_project_views_rollup()
returns trigger
language plpgsql
as $$
declare
  v_day date;
begin
  v_day := (timezone('utc', new.created_at))::date;

  insert into public.project_daily_metrics (project_id, day, views, leads)
  values (new.project_id, v_day, 1, 0)
  on conflict (project_id, day)
  do update set views = public.project_daily_metrics.views + 1;

  return new;
end;
$$;

create or replace function public.tg_leads_rollup()
returns trigger
language plpgsql
as $$
declare
  v_day date;
begin
  v_day := (timezone('utc', new.created_at))::date;

  insert into public.project_daily_metrics (project_id, day, views, leads)
  values (new.project_id, v_day, 0, 1)
  on conflict (project_id, day)
  do update set leads = public.project_daily_metrics.leads + 1;

  return new;
end;
$$;

create or replace function public.tg_apartment_views_rollup()
returns trigger
language plpgsql
as $$
declare
  v_day date;
begin
  v_day := (timezone('utc', new.created_at))::date;

  insert into public.apartment_daily_views (apartment_id, day, views)
  values (new.apartment_id, v_day, 1)
  on conflict (apartment_id, day)
  do update set views = public.apartment_daily_views.views + 1;

  return new;
end;
$$;

-- Create triggers (idempotent)
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_project_views_rollup') then
    create trigger trg_project_views_rollup
      after insert on public.project_views
      for each row
      execute function public.tg_project_views_rollup();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_leads_rollup') then
    create trigger trg_leads_rollup
      after insert on public.leads
      for each row
      execute function public.tg_leads_rollup();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_apartment_views_rollup') then
    create trigger trg_apartment_views_rollup
      after insert on public.apartment_views
      for each row
      execute function public.tg_apartment_views_rollup();
  end if;
end
$$;

-- Empty payload helper (keeps frontend contract stable)
create or replace function public.empty_admin_analytics()
returns jsonb
language sql
immutable
as $$
select jsonb_build_object(
  'projectViews', '[]'::jsonb,
  'leads', '[]'::jsonb,
  'topProjects', '[]'::jsonb,
  'topApartments', '[]'::jsonb,
  'apartmentStats', jsonb_build_object('available', 0, 'sold', 0, 'reserved', 0, 'total', 0),
  'conversionRate', 0,
  'totalViews', 0,
  'totalLeads', 0
);
$$;

-- RPC: return everything needed by AdminAnalytics as one JSON
create or replace function public.get_admin_analytics(
  p_auth_user_id uuid,
  p_is_manager_mode boolean default false,
  p_developer_id uuid default null,
  p_selected_project_id uuid default null,
  p_start_ts timestamptz default null,
  p_end_ts timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_manager_account_id uuid;
  v_project_ids uuid[];
  v_start_day date;
  v_end_day date;
  v_total_views int;
  v_total_leads int;
begin
  if p_auth_user_id is null then
    raise exception 'auth_user_id_required';
  end if;

  v_end_day := (timezone('utc', p_end_ts))::date;
  v_start_day := case when p_start_ts is null then null else (timezone('utc', p_start_ts))::date end;

  if p_is_manager_mode then
    if p_developer_id is null then
      raise exception 'developer_id_required_for_manager_mode';
    end if;

    select ma.id
      into v_manager_account_id
      from public.manager_accounts ma
      where ma.manager_id = p_auth_user_id
        and ma.developer_id = p_developer_id
        and ma.status = 'active'
      limit 1;

    if v_manager_account_id is null then
      return public.empty_admin_analytics();
    end if;

    select array_agg(distinct mpa.project_id)
      into v_project_ids
      from public.manager_project_access mpa
      where mpa.manager_account_id = v_manager_account_id;

    if v_project_ids is null or array_length(v_project_ids, 1) is null then
      select array_agg(p.id)
        into v_project_ids
        from public.projects p
        where p.user_id = p_developer_id;
    end if;
  else
    select array_agg(p.id)
      into v_project_ids
      from public.projects p
      where p.user_id = p_auth_user_id;
  end if;

  if v_project_ids is null or array_length(v_project_ids, 1) is null then
    return public.empty_admin_analytics();
  end if;

  -- Optional single-project filter (also acts as access check)
  if p_selected_project_id is not null then
    if not (p_selected_project_id = any(v_project_ids)) then
      return public.empty_admin_analytics();
    end if;
    v_project_ids := array[p_selected_project_id];
  end if;

  -- Totals (used both as KPIs and for conversion)
  select
    coalesce(sum(pdm.views), 0)::int,
    coalesce(sum(pdm.leads), 0)::int
  into v_total_views, v_total_leads
  from public.project_daily_metrics pdm
  where pdm.project_id = any(v_project_ids)
    and (v_start_day is null or pdm.day >= v_start_day)
    and pdm.day <= v_end_day;

  return jsonb_build_object(
    'projectViews',
      (
        select coalesce(
          jsonb_agg(jsonb_build_object('date', d.day::text, 'views', d.views) order by d.day),
          '[]'::jsonb
        )
        from (
          select pdm.day, sum(pdm.views)::int as views
          from public.project_daily_metrics pdm
          where pdm.project_id = any(v_project_ids)
            and (v_start_day is null or pdm.day >= v_start_day)
            and pdm.day <= v_end_day
          group by pdm.day
        ) d
      ),
    'leads',
      (
        select coalesce(
          jsonb_agg(jsonb_build_object('date', d.day::text, 'leads', d.leads) order by d.day),
          '[]'::jsonb
        )
        from (
          select pdm.day, sum(pdm.leads)::int as leads
          from public.project_daily_metrics pdm
          where pdm.project_id = any(v_project_ids)
            and (v_start_day is null or pdm.day >= v_start_day)
            and pdm.day <= v_end_day
          group by pdm.day
        ) d
      ),
    'topProjects',
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object('name', tp.name, 'views', tp.views, 'leads', tp.leads)
            order by tp.views desc
          ),
          '[]'::jsonb
        )
        from (
          select
            p.name,
            coalesce(sum(pdm.views), 0)::int as views,
            coalesce(sum(pdm.leads), 0)::int as leads
          from public.projects p
          left join public.project_daily_metrics pdm
            on pdm.project_id = p.id
           and (v_start_day is null or pdm.day >= v_start_day)
           and pdm.day <= v_end_day
          where p.id = any(v_project_ids)
          group by p.id
          order by coalesce(sum(pdm.views), 0) desc
          limit 10
        ) tp
      ),
    'topApartments',
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'apartment_number', ta.apartment_number,
              'project_name', ta.project_name,
              'views', ta.views
            )
            order by ta.views desc
          ),
          '[]'::jsonb
        )
        from (
          select
            a.apartment_number,
            p.name as project_name,
            sum(adv.views)::int as views
          from public.apartment_daily_views adv
          join public.apartments a on a.id = adv.apartment_id
          join public.projects p on p.id = a.project_id
          where a.project_id = any(v_project_ids)
            and (v_start_day is null or adv.day >= v_start_day)
            and adv.day <= v_end_day
          group by adv.apartment_id, a.apartment_number, p.name
          order by sum(adv.views) desc
          limit 10
        ) ta
      ),
    'apartmentStats',
      (
        select jsonb_build_object(
          'available', coalesce(count(*) filter (where a.status = 'available'), 0)::int,
          'sold', coalesce(count(*) filter (where a.status = 'sold'), 0)::int,
          'reserved', coalesce(count(*) filter (where a.status = 'reserved'), 0)::int,
          'total', coalesce(count(*), 0)::int
        )
        from public.apartments a
        where a.project_id = any(v_project_ids)
      ),
    'totalViews', v_total_views,
    'totalLeads', v_total_leads,
    'conversionRate',
      case
        when v_total_views > 0 then round(((v_total_leads::numeric / v_total_views::numeric) * 100)::numeric, 6)
        else 0
      end
  );
end;
$$;

-- Lock down RPC (avoid client spoofing p_auth_user_id)
revoke all on function public.get_admin_analytics(uuid, boolean, uuid, uuid, timestamptz, timestamptz) from public;
grant execute on function public.get_admin_analytics(uuid, boolean, uuid, uuid, timestamptz, timestamptz) to service_role;

