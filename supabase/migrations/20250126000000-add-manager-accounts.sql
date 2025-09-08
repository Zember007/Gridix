-- Создание таблицы для управления менеджерами
CREATE TABLE IF NOT EXISTS public.manager_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(developer_id, manager_id),
  UNIQUE(developer_id, email)
);

-- Создание таблицы для приглашений менеджеров (для случаев когда менеджер еще не зарегистрирован)
CREATE TABLE IF NOT EXISTS public.manager_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  developer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(developer_id, email)
);

-- Создание таблицы для разрешений менеджеров
CREATE TABLE IF NOT EXISTS public.manager_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_account_id UUID NOT NULL REFERENCES public.manager_accounts(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN (
    'view_projects', 
    'edit_projects', 
    'create_projects',
    'delete_projects',  -- всегда false для менеджеров
    'view_settings',
    'edit_company_settings'  -- всегда false для менеджеров
  )),
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(manager_account_id, permission_type)
);

-- Включаем RLS для всех таблиц
ALTER TABLE public.manager_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manager_permissions ENABLE ROW LEVEL SECURITY;

-- Политики RLS для manager_accounts
CREATE POLICY "Developers can view their manager accounts" 
  ON public.manager_accounts 
  FOR SELECT 
  USING (auth.uid() = developer_id);

CREATE POLICY "Managers can view their own account" 
  ON public.manager_accounts 
  FOR SELECT 
  USING (auth.uid() = manager_id);

CREATE POLICY "Developers can create manager accounts" 
  ON public.manager_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Developers can update their manager accounts" 
  ON public.manager_accounts 
  FOR UPDATE 
  USING (auth.uid() = developer_id);

CREATE POLICY "Developers can delete their manager accounts" 
  ON public.manager_accounts 
  FOR DELETE 
  USING (auth.uid() = developer_id);

-- Политики RLS для manager_invitations
CREATE POLICY "Developers can view their invitations" 
  ON public.manager_invitations 
  FOR SELECT 
  USING (auth.uid() = developer_id);

CREATE POLICY "Developers can create invitations" 
  ON public.manager_invitations 
  FOR INSERT 
  WITH CHECK (auth.uid() = developer_id);

CREATE POLICY "Developers can update their invitations" 
  ON public.manager_invitations 
  FOR UPDATE 
  USING (auth.uid() = developer_id);

CREATE POLICY "Developers can delete their invitations" 
  ON public.manager_invitations 
  FOR DELETE 
  USING (auth.uid() = developer_id);

-- Политики RLS для manager_permissions
CREATE POLICY "Developers can view permissions for their managers" 
  ON public.manager_permissions 
  FOR SELECT 
  USING (manager_account_id IN (
    SELECT id FROM public.manager_accounts WHERE developer_id = auth.uid()
  ));

CREATE POLICY "Managers can view their own permissions" 
  ON public.manager_permissions 
  FOR SELECT 
  USING (manager_account_id IN (
    SELECT id FROM public.manager_accounts WHERE manager_id = auth.uid()
  ));

CREATE POLICY "Developers can create permissions for their managers" 
  ON public.manager_permissions 
  FOR INSERT 
  WITH CHECK (manager_account_id IN (
    SELECT id FROM public.manager_accounts WHERE developer_id = auth.uid()
  ));

CREATE POLICY "Developers can update permissions for their managers" 
  ON public.manager_permissions 
  FOR UPDATE 
  USING (manager_account_id IN (
    SELECT id FROM public.manager_accounts WHERE developer_id = auth.uid()
  ));

CREATE POLICY "Developers can delete permissions for their managers" 
  ON public.manager_permissions 
  FOR DELETE 
  USING (manager_account_id IN (
    SELECT id FROM public.manager_accounts WHERE developer_id = auth.uid()
  ));

-- Обновляем политики для projects, чтобы менеджеры могли работать с проектами
-- Сначала удаляем старые политики
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

-- Создаем новые политики с учетом менеджеров
CREATE POLICY "Users and managers can view projects" 
  ON public.projects 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT manager_id FROM public.manager_accounts 
      WHERE developer_id = projects.user_id AND status = 'active'
    )
  );

CREATE POLICY "Users can create own projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can create projects for their developers" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (
    user_id IN (
      SELECT developer_id FROM public.manager_accounts 
      WHERE manager_id = auth.uid() AND status = 'active'
      AND id IN (
        SELECT manager_account_id FROM public.manager_permissions 
        WHERE permission_type = 'create_projects' AND allowed = true
      )
    )
  );

CREATE POLICY "Users and managers can update projects" 
  ON public.projects 
  FOR UPDATE 
  USING (
    auth.uid() = user_id OR 
    (auth.uid() IN (
      SELECT ma.manager_id FROM public.manager_accounts ma
      JOIN public.manager_permissions mp ON ma.id = mp.manager_account_id
      WHERE ma.developer_id = projects.user_id 
      AND ma.status = 'active'
      AND mp.permission_type = 'edit_projects' 
      AND mp.allowed = true
    ))
  );

-- Только владельцы могут удалять проекты (менеджеры не могут)
CREATE POLICY "Only owners can delete projects" 
  ON public.projects 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_manager_accounts_developer_id ON public.manager_accounts(developer_id);
CREATE INDEX IF NOT EXISTS idx_manager_accounts_manager_id ON public.manager_accounts(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_accounts_status ON public.manager_accounts(status);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_developer_id ON public.manager_invitations(developer_id);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_email ON public.manager_invitations(email);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_token ON public.manager_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_manager_permissions_account_id ON public.manager_permissions(manager_account_id);

-- Функция для создания разрешений по умолчанию для нового менеджера
CREATE OR REPLACE FUNCTION create_default_manager_permissions(manager_account_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.manager_permissions (manager_account_id, permission_type, allowed) VALUES
    (manager_account_id, 'view_projects', true),
    (manager_account_id, 'edit_projects', true),
    (manager_account_id, 'create_projects', true),
    (manager_account_id, 'delete_projects', false),
    (manager_account_id, 'view_settings', true),
    (manager_account_id, 'edit_company_settings', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер для автоматического создания разрешений при создании менеджера
CREATE OR REPLACE FUNCTION handle_new_manager_account() 
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_manager_permissions(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_manager_account_created
  AFTER INSERT ON public.manager_accounts
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_manager_account();

-- Функция для генерации токена приглашения
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;
