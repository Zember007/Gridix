begin;

alter table public.user_profiles
  add column if not exists marketing_emails_consent boolean not null default false;

comment on column public.user_profiles.marketing_emails_consent is
  'User consent to receive marketing emails.';

commit;

