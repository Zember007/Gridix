-- Add persisted user preferred locale (default: en)
-- 2026-01-29

alter table public.user_profiles
  add column if not exists preferred_locale text not null default 'en';

-- Basic normalization for existing rows (safety)
update public.user_profiles
set preferred_locale = 'en'
where preferred_locale is null or btrim(preferred_locale) = '';

