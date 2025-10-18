alter table "public"."floor_plans" drop column "polygon_settings";

alter table "public"."projects" add column "facade_open" boolean not null default false;

alter table "public"."projects" add column "polygon_settings_facade" jsonb;

alter table "public"."projects" add column "polygon_settings_floor" jsonb;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.name), NEW.id);
  ELSE
    NEW.slug := ensure_unique_slug(NEW.slug, NEW.id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_project_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.project_id IS NULL AND NEW.status != 'migrated' THEN
    RAISE EXCEPTION 'project_id is required for new subscriptions';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_expired_invitations()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.manager_invitations 
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_default_manager_permissions(manager_account_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.manager_permissions (manager_account_id, permission_type, allowed) VALUES
    (manager_account_id, 'view_projects', true),
    (manager_account_id, 'edit_projects', true),
    (manager_account_id, 'create_projects', true),
    (manager_account_id, 'delete_projects', false),
    (manager_account_id, 'view_settings', true),
    (manager_account_id, 'edit_company_settings', false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.ensure_unique_slug(base_slug text, project_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  final_slug TEXT := base_slug;
  counter INTEGER := 1;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM public.projects 
    WHERE slug = final_slug 
    AND (project_id IS NULL OR id != project_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  RETURN final_slug;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invitation_token()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Zа-яё0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_manager_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Обновляем статус соответствующего приглашения на 'accepted' если оно существует
  UPDATE public.manager_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE developer_id = NEW.developer_id 
    AND email = NEW.email 
    AND status = 'pending';
    
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_manager_account()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  PERFORM create_default_manager_permissions(NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  BEGIN
    -- Try to insert user profile
    INSERT INTO public.user_profiles (
      id, 
      email, 
      full_name, 
      company_name, 
      phone
    )
    VALUES (
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', '')
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user registration
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$
;

CREATE OR REPLACE FUNCTION public.increment_view_count(project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE public.projects 
  SET view_count = view_count + 1 
  WHERE id = project_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_default_fields(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Вставляем стандартные поля, если их еще нет
  INSERT INTO project_field_settings (project_id, field_name, field_label, field_type, is_custom, is_visible, sort_order)
  VALUES 
    (p_project_id, 'number', 'Номер квартиры', 'text', false, true, 0),
    (p_project_id, 'floor', 'Этаж', 'number', false, true, 1),
    (p_project_id, 'rooms', 'Комнаты', 'number', false, true, 2),
    (p_project_id, 'area', 'Площадь (м²)', 'number', false, true, 3),
    (p_project_id, 'price', 'Цена', 'number', false, true, 4),
    (p_project_id, 'status', 'Статус', 'select', false, true, 5)
  ON CONFLICT (project_id, field_name) DO NOTHING;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_amocrm_configured(settings_row amocrm_settings)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
BEGIN
    RETURN settings_row.access_token IS NOT NULL 
           AND settings_row.refresh_token IS NOT NULL
           AND settings_row.token_expires_at IS NOT NULL
           AND settings_row.token_expires_at > NOW()
           AND settings_row.pipeline_id IS NOT NULL
           AND settings_row.pipeline_id > 0;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_project_owner(_user_id uuid, _project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id
      AND (p.user_id = _user_id)
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$function$
;

CREATE OR REPLACE FUNCTION public.needs_token_refresh(settings_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT token_expires_at INTO expires_at
    FROM amocrm_settings
    WHERE id = settings_id;
    
    -- Return true if token expires within next 5 minutes or already expired
    RETURN expires_at IS NULL OR expires_at <= NOW() + INTERVAL '5 minutes';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_initial_next_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_active = true THEN
    NEW.next_sync = now() + (NEW.sync_interval || ' seconds')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.start_trial_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  pro_plan_id UUID;
  new_subscription_id UUID;
BEGIN
  -- Get Pro plan ID
  SELECT id INTO pro_plan_id FROM subscription_plans WHERE slug = 'pro';
  
  -- If no pro plan exists, skip trial creation (don't fail user registration)
  IF pro_plan_id IS NULL THEN
    RAISE WARNING 'No pro plan found, skipping trial subscription creation for user %', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Create trial subscription for new user
  BEGIN
    INSERT INTO user_subscriptions (
      user_id,
      plan_id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      final_price
    ) VALUES (
      NEW.id,
      pro_plan_id,
      'trialing',
      NOW() + INTERVAL '14 days',
      NOW(),
      NOW() + INTERVAL '14 days',
      0
    )
    RETURNING id INTO new_subscription_id;
    
    -- Log the trial start
    INSERT INTO subscription_history (
      user_id, 
      subscription_id, 
      action, 
      new_status
    ) VALUES (
      NEW.id,
      new_subscription_id,
      'trial_started',
      'trialing'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail user registration
    RAISE WARNING 'Failed to create trial subscription for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_project_subscription_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Update the project's subscription status when subscription changes
  IF NEW.project_id IS NOT NULL THEN
    UPDATE public.projects
    SET 
      subscription_status = NEW.status,
      subscription_expires_at = NEW.current_period_end,
      is_public_visible = CASE 
        WHEN NEW.status IN ('active', 'trialing') THEN true
        ELSE is_public_visible -- Keep current value if not active
      END
    WHERE id = NEW.project_id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_initialize_default_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Вызываем функцию инициализации полей для нового проекта
  PERFORM initialize_default_fields(NEW.id);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_amocrm_custom_fields_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_layout_photos_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_next_sync()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Если изменился интервал синхронизации, пересчитываем next_sync
  IF NEW.sync_interval != OLD.sync_interval OR NEW.is_active != OLD.is_active THEN
    IF NEW.is_active = true THEN
      NEW.next_sync = now() + (NEW.sync_interval || ' seconds')::INTERVAL;
    ELSE
      NEW.next_sync = NULL;
    END IF;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_project_domains_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.validate_amocrm_settings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Validate subdomain is not empty and doesn't contain .amocrm.ru
    IF NEW.subdomain IS NULL OR trim(NEW.subdomain) = '' THEN
        RAISE EXCEPTION 'Subdomain cannot be empty';
    END IF;
    
    IF NEW.subdomain LIKE '%.amocrm.ru%' THEN
        RAISE EXCEPTION 'Subdomain should not contain .amocrm.ru - use only the subdomain part';
    END IF;
    
    -- Normalize subdomain (remove any protocol or trailing slashes)
    NEW.subdomain = trim(lower(regexp_replace(NEW.subdomain, '^https?://', '')));
    NEW.subdomain = trim(NEW.subdomain, '/');
    
    -- Only validate pipeline_id if it's being set (not 0 or null)
    IF NEW.pipeline_id IS NOT NULL AND NEW.pipeline_id <= 0 THEN
        NEW.pipeline_id = NULL; -- Reset invalid pipeline_id
    END IF;
    
    RETURN NEW;
END;
$function$
;



