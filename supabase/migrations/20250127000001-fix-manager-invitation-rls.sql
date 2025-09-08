-- Добавляем политики для принятия приглашений

-- Разрешить anon читать действующие приглашения (для страницы accept-invitation)
CREATE POLICY "Allow anon to read pending invitations" 
  ON public.manager_invitations 
  FOR SELECT 
  TO anon
  USING (
    status = 'pending' 
    AND expires_at > now()
  );

-- Разрешить anon читать профили разработчиков для действующих приглашений
CREATE POLICY "Allow anon to read developer profiles for invitations" 
  ON public.user_profiles 
  FOR SELECT 
  TO anon
  USING (
    id IN (
      SELECT developer_id 
      FROM public.manager_invitations 
      WHERE status = 'pending' 
      AND expires_at > now()
    )
  );

-- Разрешить новому пользователю создать manager_account при принятии приглашения
CREATE POLICY "Allow invited user to create manager account" 
  ON public.manager_accounts 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = manager_id
    AND email = (auth.jwt() ->> 'email')
    AND EXISTS (
      SELECT 1 
      FROM public.manager_invitations mi
      WHERE mi.developer_id = manager_accounts.developer_id
        AND mi.email = (auth.jwt() ->> 'email')
        AND mi.status = 'pending'
        AND mi.expires_at > now()
    )
  );

-- Разрешить приглашенному пользователю обновить статус своего приглашения
CREATE POLICY "Allow invited user to update invitation status" 
  ON public.manager_invitations 
  FOR UPDATE 
  TO authenticated
  USING (
    email = (auth.jwt() ->> 'email')
    AND status = 'pending'
  )
  WITH CHECK (
    email = (auth.jwt() ->> 'email')
  );
