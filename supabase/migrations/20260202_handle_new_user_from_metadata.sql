begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
  meta jsonb;
  acct text;
  pref text;
  consent_text text;
  consent boolean;
  partner uuid;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  acct := meta->>'account_type';
  if acct not in ('developer','manager','agent') then
    acct := 'developer';
  end if;

  pref := nullif(meta->>'preferred_locale', '');
  if pref is null then
    pref := 'en';
  end if;

  consent_text := lower(coalesce(meta->>'marketing_emails_consent', ''));
  consent := consent_text in ('true','t','1','yes','y','on');

  partner := null;
  begin
    if (meta ? 'partner_id') and (meta->>'partner_id') is not null then
      if (meta->>'partner_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
        partner := (meta->>'partner_id')::uuid;
      end if;
    end if;
  exception when others then
    partner := null;
  end;

  begin
    insert into public.user_profiles (
      id,
      email,
      full_name,
      company_name,
      phone,
      account_type,
      partner_id,
      preferred_locale,
      marketing_emails_consent
    ) values (
      new.id,
      new.email,
      nullif(meta->>'full_name',''),
      nullif(meta->>'company_name',''),
      nullif(meta->>'phone',''),
      acct,
      partner,
      pref,
      consent
    )
    on conflict (id) do update set
      email = excluded.email,
      full_name = coalesce(excluded.full_name, user_profiles.full_name),
      company_name = coalesce(excluded.company_name, user_profiles.company_name),
      phone = coalesce(excluded.phone, user_profiles.phone),
      account_type = coalesce(excluded.account_type, user_profiles.account_type),
      partner_id = coalesce(excluded.partner_id, user_profiles.partner_id),
      preferred_locale = coalesce(excluded.preferred_locale, user_profiles.preferred_locale),
      marketing_emails_consent = excluded.marketing_emails_consent,
      updated_at = now();

  exception when others then
    raise warning 'Failed to create user profile for user %: %', new.id, sqlerrm;
  end;

  return new;
end;
$function$;

commit;

