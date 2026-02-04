-- Agent contract templates: metadata + HTML content for editing
-- Templates are stored in Storage, but we keep metadata + editable HTML content here

create table if not exists public.agent_contract_templates (
  id bigserial primary key,
  developer_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  lang text not null default 'RU',
  content_html text null, -- HTML content from Quill editor for editing
  storage_path text not null, -- Path in Storage bucket (agent-contracts/{developer_user_id}/...)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agent_contract_templates_name_dev_uniq unique (developer_user_id, name)
);

create index if not exists agent_contract_templates_developer_idx
  on public.agent_contract_templates (developer_user_id);

create index if not exists agent_contract_templates_lang_idx
  on public.agent_contract_templates (developer_user_id, lang);
