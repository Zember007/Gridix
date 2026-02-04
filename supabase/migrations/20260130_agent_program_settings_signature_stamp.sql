-- Add developer signature/stamp to agent program settings
alter table if exists public.agent_program_settings
  add column if not exists developer_signature_path text null,
  add column if not exists developer_stamp_path text null;

