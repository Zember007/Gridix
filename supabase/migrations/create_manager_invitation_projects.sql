-- Создание таблицы для связи приглашений менеджеров с проектами
-- Выполните этот скрипт в Supabase SQL Editor

-- Создаем таблицу для связи приглашений с проектами
CREATE TABLE IF NOT EXISTS public.manager_invitation_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invitation_id UUID NOT NULL REFERENCES public.manager_invitations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(invitation_id, project_id)
);

-- Добавляем индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_manager_invitation_projects_invitation_id 
ON public.manager_invitation_projects(invitation_id);

CREATE INDEX IF NOT EXISTS idx_manager_invitation_projects_project_id 
ON public.manager_invitation_projects(project_id);

-- Добавляем RLS политики
ALTER TABLE public.manager_invitation_projects ENABLE ROW LEVEL SECURITY;

-- Политика для застройщиков - могут видеть свои приглашения
CREATE POLICY "Developers can view their invitation projects" ON public.manager_invitation_projects
FOR SELECT USING (
  invitation_id IN (
    SELECT id FROM public.manager_invitations 
    WHERE developer_id = auth.uid()
  )
);

-- Политика для застройщиков - могут создавать связи для своих приглашений
CREATE POLICY "Developers can create invitation projects" ON public.manager_invitation_projects
FOR INSERT WITH CHECK (
  invitation_id IN (
    SELECT id FROM public.manager_invitations 
    WHERE developer_id = auth.uid()
  )
);

-- Политика для застройщиков - могут удалять связи для своих приглашений
CREATE POLICY "Developers can delete invitation projects" ON public.manager_invitation_projects
FOR DELETE USING (
  invitation_id IN (
    SELECT id FROM public.manager_invitations 
    WHERE developer_id = auth.uid()
  )
);
