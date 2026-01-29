-- Per-user read state for leads
create table if not exists public.lead_reads (
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (lead_id, user_id)
);

create index if not exists lead_reads_user_id_idx on public.lead_reads(user_id);
create index if not exists lead_reads_lead_id_idx on public.lead_reads(lead_id);

alter table public.lead_reads enable row level security;

-- Only the owner (user_id) can see/modify their read markers
create policy "lead_reads_select_own" on public.lead_reads
  for select
  using (user_id = auth.uid());

create policy "lead_reads_insert_own" on public.lead_reads
  for insert
  with check (user_id = auth.uid());

create policy "lead_reads_update_own" on public.lead_reads
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "lead_reads_delete_own" on public.lead_reads
  for delete
  using (user_id = auth.uid());

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lead_reads_set_updated_at on public.lead_reads;
create trigger lead_reads_set_updated_at
before update on public.lead_reads
for each row
execute function public.set_updated_at();

