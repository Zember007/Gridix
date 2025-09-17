-- Security hardening: fix overly-permissive RLS policies and incorrect checks

-- 1) admin_settings: remove permissive policy created earlier
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'admin_settings' AND policyname = 'Enable all operations for admin_settings'
  ) THEN
    EXECUTE 'DROP POLICY "Enable all operations for admin_settings" ON public.admin_settings';
  END IF;
END $$;

-- 2) apartment_photos: remove permissive policy and create strict policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'apartment_photos' AND policyname = 'Enable all operations for apartment_photos'
  ) THEN
    EXECUTE 'DROP POLICY "Enable all operations for apartment_photos" ON public.apartment_photos';
  END IF;
END $$;

-- Owners and managers with view/edit rights can read apartment photos
CREATE POLICY IF NOT EXISTS "Owners and managers can view apartment photos"
  ON public.apartment_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.apartments a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = apartment_photos.apartment_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type IN ('view_projects','edit_projects')
              AND mp.allowed = true
          )
        )
    )
  );

-- Owners and managers with edit rights can modify apartment photos
CREATE POLICY IF NOT EXISTS "Owners and managers can modify apartment photos"
  ON public.apartment_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.apartments a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = apartment_photos.apartment_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners and managers can update apartment photos"
  ON public.apartment_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.apartments a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = apartment_photos.apartment_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners can delete apartment photos"
  ON public.apartment_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.apartments a
      JOIN public.projects p ON p.id = a.project_id
      WHERE a.id = apartment_photos.apartment_id
        AND p.user_id = auth.uid()
    )
  );

-- 3) layout_photos: remove permissive policy and create strict policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'layout_photos' AND policyname = 'Enable all operations for layout_photos'
  ) THEN
    EXECUTE 'DROP POLICY "Enable all operations for layout_photos" ON public.layout_photos';
  END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Owners and managers can view layout photos"
  ON public.layout_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = layout_photos.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type IN ('view_projects','edit_projects')
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners and managers can modify layout photos"
  ON public.layout_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = layout_photos.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners and managers can update layout photos"
  ON public.layout_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = layout_photos.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners can delete layout photos"
  ON public.layout_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = layout_photos.project_id AND p.user_id = auth.uid()
    )
  );

-- 4) project_custom_fields: replace incorrect self-referencing policies
DO $$
BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_custom_fields' AND policyname = 'Users can view custom fields for their projects';
  IF FOUND THEN EXECUTE 'DROP POLICY "Users can view custom fields for their projects" ON project_custom_fields'; END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_custom_fields' AND policyname = 'Users can create custom fields for their projects';
  IF FOUND THEN EXECUTE 'DROP POLICY "Users can create custom fields for their projects" ON project_custom_fields'; END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_custom_fields' AND policyname = 'Users can update custom fields for their projects';
  IF FOUND THEN EXECUTE 'DROP POLICY "Users can update custom fields for their projects" ON project_custom_fields'; END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_custom_fields' AND policyname = 'Users can delete custom fields for their projects';
  IF FOUND THEN EXECUTE 'DROP POLICY "Users can delete custom fields for their projects" ON project_custom_fields'; END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Owners and managers can view project custom fields"
  ON public.project_custom_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_custom_fields.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type IN ('view_projects','edit_projects')
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners and managers can create project custom fields"
  ON public.project_custom_fields
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_custom_fields.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners and managers can update project custom fields"
  ON public.project_custom_fields
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_custom_fields.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners can delete project custom fields"
  ON public.project_custom_fields
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_custom_fields.project_id
        AND p.user_id = auth.uid()
    )
  );

-- 5) amocrm_custom_fields: fix role checks referencing manager_accounts
DO $$
BEGIN
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'amocrm_custom_fields' AND policyname = 'Users can view amocrm custom fields for their projects';
  IF FOUND THEN EXECUTE 'DROP POLICY "Users can view amocrm custom fields for their projects" ON amocrm_custom_fields'; END IF;
  PERFORM 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'amocrm_custom_fields' AND policyname = 'Users can manage amocrm custom fields for their projects';
  IF FOUND THEN EXECUTE 'DROP POLICY "Users can manage amocrm custom fields for their projects" ON amocrm_custom_fields'; END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Owners and managers can view amocrm custom fields"
  ON public.amocrm_custom_fields
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = amocrm_custom_fields.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type IN ('view_projects','edit_projects')
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners and managers can modify amocrm custom fields"
  ON public.amocrm_custom_fields
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = amocrm_custom_fields.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners and managers can update amocrm custom fields"
  ON public.amocrm_custom_fields
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = amocrm_custom_fields.project_id
        AND (
          p.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.manager_accounts ma
            JOIN public.manager_permissions mp ON mp.manager_account_id = ma.id
            WHERE ma.developer_id = p.user_id
              AND ma.manager_id = auth.uid()
              AND ma.status = 'active'
              AND mp.permission_type = 'edit_projects'
              AND mp.allowed = true
          )
        )
    )
  );

CREATE POLICY IF NOT EXISTS "Owners can delete amocrm custom fields"
  ON public.amocrm_custom_fields
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = amocrm_custom_fields.project_id AND p.user_id = auth.uid()
    )
  );

-- 6) project_views: restrict anon inserts to public projects only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'project_views' AND policyname = 'Anyone can insert project views'
  ) THEN
    EXECUTE 'DROP POLICY "Anyone can insert project views" ON public.project_views';
  END IF;
END $$;

CREATE POLICY IF NOT EXISTS "Anon can insert views for public projects"
  ON public.project_views
  FOR INSERT
  TO anon
  WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE is_public = true)
  );


