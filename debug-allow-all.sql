-- ВРЕМЕННАЯ политика для диагностики - РАЗРЕШИТЬ ВСЕ
-- ВНИМАНИЕ: Удалите эту политику после тестирования!

DROP POLICY IF EXISTS "TEMP_ALLOW_ALL_INSERT" ON public.manager_accounts;
CREATE POLICY "TEMP_ALLOW_ALL_INSERT" 
  ON public.manager_accounts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Проверим все политики
SELECT 
  policyname, 
  cmd, 
  roles,
  with_check
FROM pg_policies 
WHERE tablename = 'manager_accounts'
ORDER BY policyname;

-- После успешного теста ОБЯЗАТЕЛЬНО выполните:
-- DROP POLICY "TEMP_ALLOW_ALL_INSERT" ON public.manager_accounts;
