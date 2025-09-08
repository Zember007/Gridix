-- Проверяем все политики для manager_accounts
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'manager_accounts' 
ORDER BY policyname;

-- Проверяем, есть ли действующие приглашения
SELECT 
  id,
  email,
  full_name,
  developer_id,
  status,
  expires_at,
  invitation_token
FROM public.manager_invitations 
WHERE status = 'pending' 
AND expires_at > now()
ORDER BY created_at DESC;

-- Проверяем структуру таблицы manager_accounts
\d public.manager_accounts;

-- Тестируем политику - проверим, что происходит при попытке вставки
-- (Этот запрос покажет ошибку, но поможет понять проблему)
-- EXPLAIN (ANALYZE, BUFFERS) 
-- INSERT INTO public.manager_accounts (
--   developer_id, 
--   manager_id, 
--   email, 
--   full_name, 
--   status, 
--   accepted_at
-- ) VALUES (
--   'test-developer-id'::uuid,
--   'test-manager-id'::uuid, 
--   'test@example.com',
--   'Test User',
--   'active',
--   now()
-- );
