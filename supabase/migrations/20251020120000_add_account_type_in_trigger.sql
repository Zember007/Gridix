-- Update handle_new_user trigger function to also set account_type in user_profiles
-- account_type is derived from auth.users.raw_user_meta_data->>'account_type'
-- and defaults to 'developer' if not provided or invalid

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      company_name,
      phone,
      account_type
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      CASE
        WHEN (NEW.raw_user_meta_data->>'account_type') IN ('developer','manager') THEN NEW.raw_user_meta_data->>'account_type'
        ELSE 'developer'
      END
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
      account_type = COALESCE(
        CASE
          WHEN EXCLUDED.account_type IN ('developer','manager') THEN EXCLUDED.account_type
          ELSE NULL
        END,
        user_profiles.account_type
      ),
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$function$;


