-- Project drawer: per-project partner settings + media bank + construction updates
-- Date: 2026-02-04

-- 1) Per-project partner settings (developer controls catalog visibility and commission terms)
create table if not exists public.project_partnership_settings (
  project_id uuid primary key references public.projects (id) on delete cascade,
  is_enabled boolean not null default false,
  allow_partner_connect boolean not null default true,
  commission_type text not null default 'percent' check (commission_type in ('percent', 'fixed')),
  commission_value numeric not null default 5,
  payout_condition text null,
  contract_url text null,
  updated_at timestamptz not null default now(),
  updated_by uuid null
);

create index if not exists project_partnership_settings_project_id_idx
  on public.project_partnership_settings (project_id);

-- 2) Construction updates (developer posts timeline items)
create table if not exists public.project_construction_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  date date not null,
  title text not null,
  description text not null,
  images text[] null,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create index if not exists project_construction_updates_project_id_date_idx
  on public.project_construction_updates (project_id, date desc, created_at desc);

-- 3) Media items (renders/videos/presentations) linked to a project
create table if not exists public.project_media_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null check (kind in ('render', 'video', 'presentation')),
  title text null,
  url text not null,
  thumbnail_url text null,
  sort_index int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid null
);

create index if not exists project_media_items_project_id_kind_sort_idx
  on public.project_media_items (project_id, kind, sort_index, created_at desc);

-- Note: RLS policies are intentionally not added here because most reads/writes
-- are performed through service-role Edge Functions (agent/program + project-drawer).

