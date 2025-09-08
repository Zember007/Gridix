-- Окончательное исправление RLS для manager_accounts

-- Удаляем все существующие INSERT политики для manager_accounts
DROP POLICY IF EXISTS "Developers can create manager accounts" ON public.manager_accounts;
DROP POLICY IF EXISTS "Allow invited user to create manager account" ON public.manager_accounts;
DROP POLICY IF EXISTS "Allow anon to create manager account from invitation" ON public.manager_accounts;

-- 1. Политика для разработчиков (обычное создание)
CREATE POLICY "Developers can create manager accounts" 
  ON public.manager_accounts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = developer_id);

-- 2. Политика для принятия приглашений - УПРОЩЕННАЯ версия
CREATE POLICY "Allow invited user to create manager account" 
  ON public.manager_accounts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Проверяем что пользователь создает аккаунт для себя
    auth.uid() = manager_id
    -- И что существует действующее приглашение с таким email
    AND email IN (
      SELECT mi.email 
      FROM public.manager_invitations mi
      WHERE mi.developer_id = manager_accounts.developer_id
        AND mi.status = 'pending'
        AND mi.expires_at > now()
    )
  );

-- Проверим результат
SELECT 
  policyname, 
  cmd, 
  roles,
  with_check
FROM pg_policies 
WHERE tablename = 'manager_accounts' 
  AND cmd = 'INSERT'
ORDER BY policyname;

-- Также проверим существующие приглашения
SELECT 
  email,
  developer_id,
  status,
  expires_at > now() as is_valid
FROM public.manager_invitations 
WHERE email = 'goraegorgora130@gmail.com';
