-- Восстанавливаем RLS политики для таблицы leads

-- Сначала удаляем существующие политики, если они есть
DROP POLICY IF EXISTS "Service role can access all leads" ON "public"."leads";
DROP POLICY IF EXISTS "Users can create leads for their projects" ON "public"."leads";
DROP POLICY IF EXISTS "Users can update leads for their projects" ON "public"."leads";
DROP POLICY IF EXISTS "Users can view leads for their projects" ON "public"."leads";
DROP POLICY IF EXISTS "Managers can view leads for accessible projects" ON "public"."leads";
DROP POLICY IF EXISTS "Managers can update leads for accessible projects" ON "public"."leads";
DROP POLICY IF EXISTS "Managers can create leads for accessible projects" ON "public"."leads";

-- Политика для service_role (для системных операций)
CREATE POLICY "Service role can access all leads"
ON "public"."leads"
AS PERMISSIVE
FOR ALL
TO public
USING ((auth.role() = 'service_role'::text));

-- Политика для владельцев проектов - создание лидов
CREATE POLICY "Users can create leads for their projects"
ON "public"."leads"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = leads.project_id) AND (p.user_id = auth.uid())))));

-- Политика для владельцев проектов - обновление лидов
CREATE POLICY "Users can update leads for their projects"
ON "public"."leads"
AS PERMISSIVE
FOR UPDATE
TO public
USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = leads.project_id) AND (p.user_id = auth.uid())))));

-- Политика для владельцев проектов - просмотр лидов
CREATE POLICY "Users can view leads for their projects"
ON "public"."leads"
AS PERMISSIVE
FOR SELECT
TO public
USING ((EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = leads.project_id) AND (p.user_id = auth.uid())))));

-- Политика для менеджеров - просмотр лидов проектов, к которым у них есть доступ
CREATE POLICY "Managers can view leads for accessible projects"
ON "public"."leads"
AS PERMISSIVE
FOR SELECT
TO public
USING ((EXISTS ( SELECT 1
   FROM projects p
   JOIN manager_accounts ma ON (ma.developer_id = p.user_id)
   JOIN manager_project_access mpa ON (mpa.manager_account_id = ma.id)
  WHERE ((p.id = leads.project_id) AND (ma.manager_id = auth.uid()) AND (ma.status = 'active'::text) AND (mpa.project_id = p.id)))));

-- Политика для менеджеров - обновление лидов проектов, к которым у них есть доступ
CREATE POLICY "Managers can update leads for accessible projects"
ON "public"."leads"
AS PERMISSIVE
FOR UPDATE
TO public
USING ((EXISTS ( SELECT 1
   FROM projects p
   JOIN manager_accounts ma ON (ma.developer_id = p.user_id)
   JOIN manager_project_access mpa ON (mpa.manager_account_id = ma.id)
  WHERE ((p.id = leads.project_id) AND (ma.manager_id = auth.uid()) AND (ma.status = 'active'::text) AND (mpa.project_id = p.id)))));

-- Политика для менеджеров - создание лидов для проектов, к которым у них есть доступ
CREATE POLICY "Managers can create leads for accessible projects"
ON "public"."leads"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK ((EXISTS ( SELECT 1
   FROM projects p
   JOIN manager_accounts ma ON (ma.developer_id = p.user_id)
   JOIN manager_project_access mpa ON (mpa.manager_account_id = ma.id)
  WHERE ((p.id = leads.project_id) AND (ma.manager_id = auth.uid()) AND (ma.status = 'active'::text) AND (mpa.project_id = p.id)))));

-- Восстанавливаем RLS политики для manager_accounts

-- Удаляем существующие политики для manager_accounts
DROP POLICY IF EXISTS "Developers can create manager accounts" ON "public"."manager_accounts";
DROP POLICY IF EXISTS "Developers can view their manager accounts" ON "public"."manager_accounts";
DROP POLICY IF EXISTS "Developers can update their manager accounts" ON "public"."manager_accounts";
DROP POLICY IF EXISTS "Developers can delete their manager accounts" ON "public"."manager_accounts";
DROP POLICY IF EXISTS "Managers can view their own account" ON "public"."manager_accounts";
DROP POLICY IF EXISTS "Allow invited user to create manager account" ON "public"."manager_accounts";

-- Разработчики могут создавать аккаунты менеджеров
CREATE POLICY "Developers can create manager accounts"
ON "public"."manager_accounts"
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = developer_id));

-- Разработчики могут просматривать свои аккаунты менеджеров
CREATE POLICY "Developers can view their manager accounts"
ON "public"."manager_accounts"
AS PERMISSIVE
FOR SELECT
TO public
USING ((auth.uid() = developer_id));

-- Разработчики могут обновлять свои аккаунты менеджеров
CREATE POLICY "Developers can update their manager accounts"
ON "public"."manager_accounts"
AS PERMISSIVE
FOR UPDATE
TO public
USING ((auth.uid() = developer_id));

-- Разработчики могут удалять свои аккаунты менеджеров
CREATE POLICY "Developers can delete their manager accounts"
ON "public"."manager_accounts"
AS PERMISSIVE
FOR DELETE
TO public
USING ((auth.uid() = developer_id));

-- Менеджеры могут просматривать свой аккаунт
CREATE POLICY "Managers can view their own account"
ON "public"."manager_accounts"
AS PERMISSIVE
FOR SELECT
TO public
USING ((auth.uid() = manager_id));


-- Восстанавливаем RLS политики для manager_project_access

-- Удаляем существующие политики для manager_project_access
DROP POLICY IF EXISTS "Developers can manage their managers' project access" ON "public"."manager_project_access";
DROP POLICY IF EXISTS "Developers can view their managers' project access" ON "public"."manager_project_access";
DROP POLICY IF EXISTS "Managers can view their own project access" ON "public"."manager_project_access";

-- Разработчики могут управлять доступом к проектам для своих менеджеров
CREATE POLICY "Developers can manage their managers' project access"
ON "public"."manager_project_access"
AS PERMISSIVE
FOR ALL
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.developer_id = auth.uid())))))
WITH CHECK ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.developer_id = auth.uid())))));

-- Разработчики могут просматривать доступ к проектам для своих менеджеров
CREATE POLICY "Developers can view their managers' project access"
ON "public"."manager_project_access"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.developer_id = auth.uid())))));

-- Менеджеры могут просматривать свой доступ к проектам
CREATE POLICY "Managers can view their own project access"
ON "public"."manager_project_access"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING ((EXISTS ( SELECT 1
   FROM manager_accounts ma
  WHERE ((ma.id = manager_project_access.manager_account_id) AND (ma.manager_id = auth.uid())))));

-- Восстанавливаем RLS политики для manager_permissions

-- Удаляем существующие политики для manager_permissions
DROP POLICY IF EXISTS "Developers can create permissions for their managers" ON "public"."manager_permissions";
DROP POLICY IF EXISTS "Developers can view permissions for their managers" ON "public"."manager_permissions";
DROP POLICY IF EXISTS "Developers can update permissions for their managers" ON "public"."manager_permissions";
DROP POLICY IF EXISTS "Developers can delete permissions for their managers" ON "public"."manager_permissions";
DROP POLICY IF EXISTS "Managers can view their own permissions" ON "public"."manager_permissions";

-- Разработчики могут создавать разрешения для своих менеджеров
CREATE POLICY "Developers can create permissions for their managers"
ON "public"."manager_permissions"
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));

-- Разработчики могут просматривать разрешения для своих менеджеров
CREATE POLICY "Developers can view permissions for their managers"
ON "public"."manager_permissions"
AS PERMISSIVE
FOR SELECT
TO public
USING ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));

-- Разработчики могут обновлять разрешения для своих менеджеров
CREATE POLICY "Developers can update permissions for their managers"
ON "public"."manager_permissions"
AS PERMISSIVE
FOR UPDATE
TO public
USING ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));

-- Разработчики могут удалять разрешения для своих менеджеров
CREATE POLICY "Developers can delete permissions for their managers"
ON "public"."manager_permissions"
AS PERMISSIVE
FOR DELETE
TO public
USING ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.developer_id = auth.uid()))));

-- Менеджеры могут просматривать свои разрешения
CREATE POLICY "Managers can view their own permissions"
ON "public"."manager_permissions"
AS PERMISSIVE
FOR SELECT
TO public
USING ((manager_account_id IN ( SELECT manager_accounts.id
   FROM manager_accounts
  WHERE (manager_accounts.manager_id = auth.uid()))));

