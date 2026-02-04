-- Secure RPC to check whether the current auth user has a password set.
-- This reads auth.users.encrypted_password (protected schema) via SECURITY DEFINER.

create or replace function public.check_if_user_has_password()
returns boolean
language sql
security definer
set search_path = public
as $$
  select (encrypted_password is not null)
  from auth.users
  where id = auth.uid();
$$;

