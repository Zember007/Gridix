-- Create project_domains table for custom domain mapping
create table if not exists public.project_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  domain text not null unique,                -- example: myproject.ru or www.myproject.ru
  is_primary boolean not null default true,   -- mark primary domain for the project
  status text not null default 'active',      -- active|pending|disabled (for future verification)
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create index for faster domain lookup
create index idx_project_domains_domain on public.project_domains(domain);
create index idx_project_domains_project_id on public.project_domains(project_id);

-- Enable RLS
alter table public.project_domains enable row level security;

-- Allow reading domains for anyone (needed for domain resolution)
create policy "allow_read_domains"
on public.project_domains for select
using (true);

-- Allow project owners to manage their domains
create policy "owner_manage_domains"
on public.project_domains for all
to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id = project_domains.project_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_domains.project_id
      and p.user_id = auth.uid()
  )
);

-- Function to update updated_at timestamp
create or replace function update_project_domains_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger trigger_project_domains_updated_at
  before update on public.project_domains
  for each row
  execute function update_project_domains_updated_at();
