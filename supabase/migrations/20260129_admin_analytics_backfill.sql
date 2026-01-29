-- Admin analytics rollup backfill (historical data)
-- 2026-01-29

-- Backfill project views into daily rollup
insert into public.project_daily_metrics (project_id, day, views, leads)
select
  pv.project_id,
  (timezone('utc', pv.created_at))::date as day,
  count(*)::int as views,
  0 as leads
from public.project_views pv
group by pv.project_id, (timezone('utc', pv.created_at))::date
on conflict (project_id, day)
do update set views = excluded.views;

-- Backfill leads into daily rollup
insert into public.project_daily_metrics (project_id, day, views, leads)
select
  l.project_id,
  (timezone('utc', l.created_at))::date as day,
  0 as views,
  count(*)::int as leads
from public.leads l
group by l.project_id, (timezone('utc', l.created_at))::date
on conflict (project_id, day)
do update set leads = excluded.leads;

-- Backfill apartment views into daily rollup
insert into public.apartment_daily_views (apartment_id, day, views)
select
  av.apartment_id,
  (timezone('utc', av.created_at))::date as day,
  count(*)::int as views
from public.apartment_views av
group by av.apartment_id, (timezone('utc', av.created_at))::date
on conflict (apartment_id, day)
do update set views = excluded.views;

