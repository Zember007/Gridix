

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."apartment_type" AS ENUM (
    'apartment',
    'commercial',
    'parking'
);


ALTER TYPE "public"."apartment_type" OWNER TO "postgres";


CREATE TYPE "public"."app_role" AS ENUM (
    'superadmin',
    'admin',
    'moderator',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."currency_type" AS ENUM (
    'RUB',
    'USD',
    'EUR',
    'GEL'
);


ALTER TYPE "public"."currency_type" OWNER TO "postgres";


CREATE TYPE "public"."project_type" AS ENUM (
    'building',
    'object'
);


ALTER TYPE "public"."project_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_generate_slug"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.name), NEW.id);
  ELSE
    NEW.slug := ensure_unique_slug(NEW.slug, NEW.id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_generate_slug"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_project_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.project_id IS NULL AND NEW.status != 'migrated' THEN
    RAISE EXCEPTION 'project_id is required for new subscriptions';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_project_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_invitations"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.manager_invitations 
  WHERE status = 'pending' AND expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_invitations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_company_settings_for_user"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Insert a new company_settings record for the new user
  INSERT INTO company_settings (
    user_id,
    company_name,
    tax_id,
    address,
    phone,
    email,
    bank_name,
    iban,
    currency,
    vat_payer
  ) VALUES (
    NEW.id,
    COALESCE(NEW.company_name, ''),
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'GEL',
    false
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_company_settings_for_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_manager_permissions"("manager_account_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.manager_permissions (manager_account_id, permission_type, allowed) VALUES
    (manager_account_id, 'view_projects', true),
    (manager_account_id, 'edit_projects', true),
    (manager_account_id, 'create_projects', true),
    (manager_account_id, 'delete_projects', false),
    (manager_account_id, 'view_settings', true),
    (manager_account_id, 'edit_company_settings', false);
END;
$$;


ALTER FUNCTION "public"."create_default_manager_permissions"("manager_account_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_unique_slug"("base_slug" "text", "project_id" "uuid" DEFAULT NULL::"uuid") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."ensure_unique_slug"("base_slug" "text", "project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invitation_token"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;


ALTER FUNCTION "public"."generate_invitation_token"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_slug"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_slug"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_manager_account_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Обновляем статус соответствующего приглашения на 'accepted' если оно существует
  UPDATE public.manager_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE developer_id = NEW.developer_id 
    AND email = NEW.email 
    AND status = 'pending';
    
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_manager_account_created"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_manager_account"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM create_default_manager_permissions(NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_manager_account"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      company_name,
      phone,
      account_type
    )
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      CASE
        WHEN (NEW.raw_user_meta_data->>'account_type') IN ('developer','manager') THEN NEW.raw_user_meta_data->>'account_type'
        ELSE 'developer'
      END
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
      account_type = COALESCE(
        CASE
          WHEN EXCLUDED.account_type IN ('developer','manager') THEN EXCLUDED.account_type
          ELSE NULL
        END,
        user_profiles.account_type
      ),
      updated_at = NOW();

  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE public.projects 
  SET view_count = view_count + 1 
  WHERE id = project_id;
END;
$$;


ALTER FUNCTION "public"."increment_view_count"("project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_default_fields"("p_project_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."initialize_default_fields"("p_project_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."amocrm_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "subdomain" "text" NOT NULL,
    "pipeline_id" integer NOT NULL,
    "status_id" integer,
    "responsible_user_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "client_id" "text",
    "client_secret" "text",
    "access_token" "text",
    "refresh_token" "text",
    "token_expires_at" timestamp with time zone,
    "authorization_code" "text",
    "redirect_uri" "text",
    "pipeline_name" "text",
    "status_name" "text",
    "user_name" "text",
    "account_name" "text",
    "base_domain" "text",
    CONSTRAINT "check_pipeline_id_positive" CHECK ((("pipeline_id" IS NULL) OR ("pipeline_id" > 0)))
);


ALTER TABLE "public"."amocrm_settings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."amocrm_settings"."subdomain" IS 'AmoCRM subdomain part only (e.g., georgiib722)';



COMMENT ON COLUMN "public"."amocrm_settings"."pipeline_name" IS 'Display name of the selected pipeline';



COMMENT ON COLUMN "public"."amocrm_settings"."status_name" IS 'Display name of the selected status';



COMMENT ON COLUMN "public"."amocrm_settings"."user_name" IS 'Display name of the responsible user';



COMMENT ON COLUMN "public"."amocrm_settings"."account_name" IS 'Display name of the AmoCRM account';



COMMENT ON COLUMN "public"."amocrm_settings"."base_domain" IS 'Full AmoCRM domain (e.g., georgiib722.amocrm.ru)';



CREATE OR REPLACE FUNCTION "public"."is_amocrm_configured"("settings_row" "public"."amocrm_settings") RETURNS boolean
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
BEGIN
    RETURN settings_row.access_token IS NOT NULL 
           AND settings_row.refresh_token IS NOT NULL
           AND settings_row.token_expires_at IS NOT NULL
           AND settings_row.token_expires_at > NOW()
           AND settings_row.pipeline_id IS NOT NULL
           AND settings_row.pipeline_id > 0;
END;
$$;


ALTER FUNCTION "public"."is_amocrm_configured"("settings_row" "public"."amocrm_settings") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_owner"("_user_id" "uuid", "_project_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = _project_id
      AND (p.user_id = _user_id)
  );
$$;


ALTER FUNCTION "public"."is_project_owner"("_user_id" "uuid", "_project_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_superadmin"("_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;


ALTER FUNCTION "public"."is_superadmin"("_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."needs_token_refresh"("settings_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT token_expires_at INTO expires_at
    FROM amocrm_settings
    WHERE id = settings_id;
    
    -- Return true if token expires within next 5 minutes or already expired
    RETURN expires_at IS NULL OR expires_at <= NOW() + INTERVAL '5 minutes';
END;
$$;


ALTER FUNCTION "public"."needs_token_refresh"("settings_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_initial_next_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.is_active = true THEN
    NEW.next_sync = now() + (NEW.sync_interval || ' seconds')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_initial_next_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_trial_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
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
$$;


ALTER FUNCTION "public"."start_trial_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_project_subscription_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_project_subscription_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_initialize_default_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Вызываем функцию инициализации полей для нового проекта
  PERFORM initialize_default_fields(NEW.id);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_initialize_default_fields"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_amocrm_custom_fields_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_amocrm_custom_fields_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_layout_photos_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_layout_photos_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_next_sync"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_next_sync"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_domains_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_project_domains_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_amocrm_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."validate_amocrm_settings"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."amocrm_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "field_id" integer NOT NULL,
    "field_name" "text" NOT NULL,
    "field_code" "text",
    "field_type" "text" NOT NULL,
    "is_required" boolean DEFAULT false,
    "is_editable" boolean DEFAULT true,
    "sort" integer DEFAULT 0,
    "entity_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."amocrm_custom_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apartment_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."apartment_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."apartments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "floor_plan_id" "uuid",
    "apartment_number" "text" NOT NULL,
    "floor_number" integer NOT NULL,
    "rooms" "text" NOT NULL,
    "area" numeric(10,2) DEFAULT 0 NOT NULL,
    "price" bigint DEFAULT 0,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "polygon" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "custom_fields" "jsonb" DEFAULT '{}'::"jsonb",
    "type" "public"."apartment_type" DEFAULT 'apartment'::"public"."apartment_type",
    CONSTRAINT "apartments_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'sold'::"text", 'reserved'::"text"])))
);


ALTER TABLE "public"."apartments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."apartments"."type" IS 'Type of the unit: apartment, commercial, or parking';



CREATE TABLE IF NOT EXISTS "public"."banned_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "banned_by" "uuid" NOT NULL,
    "reason" "text",
    "banned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "unbanned_at" timestamp with time zone
);


ALTER TABLE "public"."banned_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."building_floors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "floor_number" integer NOT NULL,
    "polygon" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "color" "text" DEFAULT '#3b82f6'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."building_floors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_name" "text" NOT NULL,
    "tax_id" "text",
    "address" "text",
    "phone" "text",
    "email" "text",
    "bank_name" "text",
    "iban" "text",
    "currency" "text" DEFAULT 'GEL'::"text",
    "vat_payer" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."company_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."floor_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "floor_number" integer NOT NULL,
    "image_url" "text",
    "floor_polygons" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."floor_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."layout_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "layout_type" "text" NOT NULL,
    "image_url" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."layout_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."leads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "apartment_id" "uuid" NOT NULL,
    "amocrm_lead_id" bigint,
    "amocrm_contact_id" bigint,
    "amocrm_sent_at" timestamp with time zone,
    "amocrm_error" "text",
    "amocrm_retries" integer DEFAULT 0,
    "status" "text" DEFAULT 'pending'::"text",
    "source" "text" DEFAULT 'website'::"text",
    "notes" "text",
    CONSTRAINT "leads_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent_to_crm'::"text", 'saved_only'::"text", 'failed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."leads" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manager_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "developer_id" "uuid" NOT NULL,
    "manager_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "invited_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "manager_accounts_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'suspended'::"text"])))
);


ALTER TABLE "public"."manager_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manager_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "manager_account_id" "uuid" NOT NULL,
    "permission_type" "text" NOT NULL,
    "allowed" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "manager_permissions_permission_type_check" CHECK (("permission_type" = ANY (ARRAY['view_projects'::"text", 'edit_projects'::"text", 'create_projects'::"text", 'delete_projects'::"text", 'view_settings'::"text", 'edit_company_settings'::"text"])))
);


ALTER TABLE "public"."manager_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."manager_project_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "manager_account_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."manager_project_access" OWNER TO "postgres";


COMMENT ON TABLE "public"."manager_project_access" IS 'Controls which projects each manager can access. If no records exist for a manager, they have access to all projects (backward compatibility). If records exist, they can only access specified projects.';



CREATE TABLE IF NOT EXISTS "public"."project_custom_fields" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "field_label" "text" NOT NULL,
    "field_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "is_required" boolean DEFAULT false NOT NULL,
    "field_options" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "field_label_translations" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."project_custom_fields" OWNER TO "postgres";


COMMENT ON COLUMN "public"."project_custom_fields"."field_label_translations" IS 'JSON object containing field label translations for supported languages (ru, en, ka)';



CREATE TABLE IF NOT EXISTS "public"."project_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "is_primary" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_field_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "field_label" "text" NOT NULL,
    "field_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "is_custom" boolean DEFAULT false NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_field_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_sync_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "excel_url" "text" NOT NULL,
    "sync_interval" integer DEFAULT 300 NOT NULL,
    "column_mapping" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_sync" timestamp with time zone,
    "next_sync" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "project_sync_settings_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'error'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."project_sync_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "referrer" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "floors" integer DEFAULT 1 NOT NULL,
    "building_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "address" "text",
    "user_id" "uuid",
    "slug" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "view_count" integer DEFAULT 0 NOT NULL,
    "currency" "public"."currency_type" DEFAULT 'USD'::"public"."currency_type",
    "has_parking" boolean DEFAULT false,
    "has_commercial" boolean DEFAULT false,
    "installment_enabled" boolean DEFAULT false,
    "min_down_payment_percent" integer DEFAULT 20,
    "max_installment_months" integer DEFAULT 24,
    "pdf_presentation_url" "text",
    "theme_color" "text" DEFAULT '#000000'::"text",
    "project_type" "public"."project_type" DEFAULT 'building'::"public"."project_type" NOT NULL,
    "subscription_status" "text" DEFAULT 'trial'::"text",
    "subscription_expires_at" timestamp with time zone,
    "is_public_visible" boolean DEFAULT true,
    "facade_open" boolean DEFAULT false NOT NULL,
    "polygon_settings_facade" "jsonb",
    "polygon_settings_floor" "jsonb",
    CONSTRAINT "projects_max_installment_months_check" CHECK (("max_installment_months" > 0)),
    CONSTRAINT "projects_min_down_payment_percent_check" CHECK ((("min_down_payment_percent" >= 0) AND ("min_down_payment_percent" <= 100)))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON COLUMN "public"."projects"."is_public" IS 'Indicates if the project is publicly visible. Default is true to allow widget embedding and public access.';



COMMENT ON COLUMN "public"."projects"."currency" IS 'Валюта для отображения цен в проекте';



COMMENT ON COLUMN "public"."projects"."has_parking" IS 'Whether the project includes parking spaces';



COMMENT ON COLUMN "public"."projects"."has_commercial" IS 'Whether the project includes commercial spaces';



COMMENT ON COLUMN "public"."projects"."installment_enabled" IS 'Whether installment payments are enabled for this project';



COMMENT ON COLUMN "public"."projects"."min_down_payment_percent" IS 'Minimum down payment percentage required (0-100)';



COMMENT ON COLUMN "public"."projects"."max_installment_months" IS 'Maximum number of months for installment payments';



COMMENT ON COLUMN "public"."projects"."theme_color" IS 'Primary theme color for the project interface in hex format (e.g., #3b82f6)';



COMMENT ON COLUMN "public"."projects"."subscription_status" IS 'Current subscription status for this project';



COMMENT ON COLUMN "public"."projects"."subscription_expires_at" IS 'When the project subscription expires';



COMMENT ON COLUMN "public"."projects"."is_public_visible" IS 'Whether project should appear in public gallery (based on subscription)';



CREATE TABLE IF NOT EXISTS "public"."subscription_discounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "duration_months" integer NOT NULL,
    "discount_percentage" numeric(5,2) NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_discounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription_id" "uuid" NOT NULL,
    "action" character varying(50) NOT NULL,
    "old_status" character varying(50),
    "new_status" character varying(50),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscription_plans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "slug" character varying(100) NOT NULL,
    "description" "text",
    "base_price" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'USD'::character varying,
    "features" "jsonb" DEFAULT '[]'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscription_plans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sync_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "sync_settings_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "records_processed" integer DEFAULT 0,
    "records_updated" integer DEFAULT 0,
    "records_added" integer DEFAULT 0,
    "records_deleted" integer DEFAULT 0,
    "error_message" "text",
    "execution_time_ms" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sync_logs_status_check" CHECK (("status" = ANY (ARRAY['success'::"text", 'error'::"text", 'partial'::"text"])))
);


ALTER TABLE "public"."sync_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "company_name" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_type" "text" DEFAULT 'developer'::"text" NOT NULL,
    "tax_id" "text",
    "legal_address" "text",
    "bank_name" "text",
    "iban" "text",
    "billing_currency" "text" DEFAULT 'GEL'::"text",
    "is_vat_payer" boolean DEFAULT false,
    CONSTRAINT "check_account_type" CHECK (("account_type" = ANY (ARRAY['developer'::"text", 'manager'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."tax_id" IS 'Company identification code (Tax ID)';



COMMENT ON COLUMN "public"."user_profiles"."legal_address" IS 'Legal registration address';



COMMENT ON COLUMN "public"."user_profiles"."bank_name" IS 'Bank name (e.g., TBC Bank)';



COMMENT ON COLUMN "public"."user_profiles"."iban" IS 'Bank account IBAN';



COMMENT ON COLUMN "public"."user_profiles"."billing_currency" IS 'Billing currency (default GEL)';



COMMENT ON COLUMN "public"."user_profiles"."is_vat_payer" IS 'Whether company is VAT payer';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_id" "uuid" NOT NULL,
    "lemon_squeezy_subscription_id" character varying(255),
    "lemon_squeezy_customer_id" character varying(255),
    "status" character varying(50) DEFAULT 'inactive'::character varying NOT NULL,
    "trial_ends_at" timestamp with time zone,
    "current_period_start" timestamp with time zone,
    "current_period_end" timestamp with time zone,
    "cancel_at_period_end" boolean DEFAULT false,
    "cancelled_at" timestamp with time zone,
    "duration_months" integer DEFAULT 1,
    "discount_percentage" numeric(5,2) DEFAULT 0,
    "final_price" numeric(10,2),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "project_id" "uuid",
    "invoice_number" "text",
    "invoice_url" "text",
    "invoice_requested_at" timestamp with time zone,
    "invoice_paid_at" timestamp with time zone,
    "payment_method" "text",
    "invoice_generated_at" timestamp with time zone,
    "payment_purpose" "text",
    CONSTRAINT "user_subscriptions_payment_method_check" CHECK (("payment_method" = ANY (ARRAY['invoice'::"text", 'card'::"text"])))
);


ALTER TABLE "public"."user_subscriptions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_subscriptions"."project_id" IS 'Links subscription to a specific project. Required for all new subscriptions.';



COMMENT ON COLUMN "public"."user_subscriptions"."invoice_number" IS 'Manual invoice number for tracking payments';



COMMENT ON COLUMN "public"."user_subscriptions"."invoice_url" IS 'URL to the invoice document/PDF';



COMMENT ON COLUMN "public"."user_subscriptions"."invoice_requested_at" IS 'Timestamp when user requested an invoice';



COMMENT ON COLUMN "public"."user_subscriptions"."invoice_paid_at" IS 'Timestamp when invoice was marked as paid';



ALTER TABLE ONLY "public"."amocrm_custom_fields"
    ADD CONSTRAINT "amocrm_custom_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."amocrm_custom_fields"
    ADD CONSTRAINT "amocrm_custom_fields_project_id_field_id_entity_type_key" UNIQUE ("project_id", "field_id", "entity_type");



ALTER TABLE ONLY "public"."amocrm_settings"
    ADD CONSTRAINT "amocrm_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartment_photos"
    ADD CONSTRAINT "apartment_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_project_id_apartment_number_key" UNIQUE ("project_id", "apartment_number");



ALTER TABLE ONLY "public"."banned_users"
    ADD CONSTRAINT "banned_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."banned_users"
    ADD CONSTRAINT "banned_users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."building_floors"
    ADD CONSTRAINT "building_floors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."building_floors"
    ADD CONSTRAINT "building_floors_project_id_floor_number_key" UNIQUE ("project_id", "floor_number");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."floor_plans"
    ADD CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."floor_plans"
    ADD CONSTRAINT "floor_plans_project_id_floor_number_key" UNIQUE ("project_id", "floor_number");



ALTER TABLE ONLY "public"."layout_photos"
    ADD CONSTRAINT "layout_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."layout_photos"
    ADD CONSTRAINT "layout_photos_project_id_layout_type_order_index_key" UNIQUE ("project_id", "layout_type", "order_index");



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manager_accounts"
    ADD CONSTRAINT "manager_accounts_developer_id_email_key" UNIQUE ("developer_id", "email");



ALTER TABLE ONLY "public"."manager_accounts"
    ADD CONSTRAINT "manager_accounts_developer_id_manager_id_key" UNIQUE ("developer_id", "manager_id");



ALTER TABLE ONLY "public"."manager_accounts"
    ADD CONSTRAINT "manager_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manager_permissions"
    ADD CONSTRAINT "manager_permissions_manager_account_id_permission_type_key" UNIQUE ("manager_account_id", "permission_type");



ALTER TABLE ONLY "public"."manager_permissions"
    ADD CONSTRAINT "manager_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."manager_project_access"
    ADD CONSTRAINT "manager_project_access_manager_account_id_project_id_key" UNIQUE ("manager_account_id", "project_id");



ALTER TABLE ONLY "public"."manager_project_access"
    ADD CONSTRAINT "manager_project_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_custom_fields"
    ADD CONSTRAINT "project_custom_fields_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_custom_fields"
    ADD CONSTRAINT "project_custom_fields_project_id_field_name_key" UNIQUE ("project_id", "field_name");



ALTER TABLE ONLY "public"."project_domains"
    ADD CONSTRAINT "project_domains_domain_key" UNIQUE ("domain");



ALTER TABLE ONLY "public"."project_domains"
    ADD CONSTRAINT "project_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_field_settings"
    ADD CONSTRAINT "project_field_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_field_settings"
    ADD CONSTRAINT "project_field_settings_project_id_field_name_key" UNIQUE ("project_id", "field_name");



ALTER TABLE ONLY "public"."project_sync_settings"
    ADD CONSTRAINT "project_sync_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_sync_settings"
    ADD CONSTRAINT "project_sync_settings_project_id_key" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."subscription_discounts"
    ADD CONSTRAINT "subscription_discounts_duration_months_key" UNIQUE ("duration_months");



ALTER TABLE ONLY "public"."subscription_discounts"
    ADD CONSTRAINT "subscription_discounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscription_plans"
    ADD CONSTRAINT "subscription_plans_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."sync_logs"
    ADD CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_project_unique" UNIQUE ("user_id", "project_id");



CREATE INDEX "idx_amocrm_custom_fields_entity_type" ON "public"."amocrm_custom_fields" USING "btree" ("entity_type");



CREATE INDEX "idx_amocrm_custom_fields_project_id" ON "public"."amocrm_custom_fields" USING "btree" ("project_id");



CREATE UNIQUE INDEX "idx_amocrm_settings_project_id" ON "public"."amocrm_settings" USING "btree" ("project_id");



CREATE INDEX "idx_amocrm_token_expiration" ON "public"."amocrm_settings" USING "btree" ("token_expires_at") WHERE ("token_expires_at" IS NOT NULL);



CREATE INDEX "idx_apartment_photos_apartment_id" ON "public"."apartment_photos" USING "btree" ("apartment_id");



CREATE INDEX "idx_apartment_photos_order_index" ON "public"."apartment_photos" USING "btree" ("apartment_id", "order_index");



CREATE INDEX "idx_apartments_floor_plan_id" ON "public"."apartments" USING "btree" ("floor_plan_id");



CREATE INDEX "idx_apartments_project_id" ON "public"."apartments" USING "btree" ("project_id");



CREATE INDEX "idx_apartments_project_type" ON "public"."apartments" USING "btree" ("project_id", "type");



CREATE INDEX "idx_apartments_type" ON "public"."apartments" USING "btree" ("type");



CREATE INDEX "idx_building_floors_project_id" ON "public"."building_floors" USING "btree" ("project_id");



CREATE INDEX "idx_company_settings_user_id" ON "public"."company_settings" USING "btree" ("user_id");



CREATE INDEX "idx_floor_plans_project_id" ON "public"."floor_plans" USING "btree" ("project_id");



CREATE INDEX "idx_layout_photos_layout_type" ON "public"."layout_photos" USING "btree" ("project_id", "layout_type");



CREATE INDEX "idx_layout_photos_order_index" ON "public"."layout_photos" USING "btree" ("project_id", "layout_type", "order_index");



CREATE INDEX "idx_layout_photos_project_id" ON "public"."layout_photos" USING "btree" ("project_id");



CREATE INDEX "idx_leads_amocrm_sent_at" ON "public"."leads" USING "btree" ("amocrm_sent_at");



CREATE INDEX "idx_leads_apartment_id" ON "public"."leads" USING "btree" ("apartment_id");



CREATE INDEX "idx_leads_created_at" ON "public"."leads" USING "btree" ("created_at");



CREATE INDEX "idx_leads_project_id" ON "public"."leads" USING "btree" ("project_id");



CREATE INDEX "idx_leads_status" ON "public"."leads" USING "btree" ("status");



CREATE INDEX "idx_manager_accounts_developer_id" ON "public"."manager_accounts" USING "btree" ("developer_id");



CREATE INDEX "idx_manager_accounts_manager_id" ON "public"."manager_accounts" USING "btree" ("manager_id");



CREATE INDEX "idx_manager_accounts_status" ON "public"."manager_accounts" USING "btree" ("status");



CREATE INDEX "idx_manager_permissions_account_id" ON "public"."manager_permissions" USING "btree" ("manager_account_id");



CREATE INDEX "idx_manager_project_access_manager_id" ON "public"."manager_project_access" USING "btree" ("manager_account_id");



CREATE INDEX "idx_manager_project_access_project_id" ON "public"."manager_project_access" USING "btree" ("project_id");



CREATE INDEX "idx_project_custom_fields_sort_order" ON "public"."project_custom_fields" USING "btree" ("project_id", "sort_order");



CREATE INDEX "idx_project_custom_fields_translations" ON "public"."project_custom_fields" USING "gin" ("field_label_translations");



CREATE INDEX "idx_project_domains_domain" ON "public"."project_domains" USING "btree" ("domain");



CREATE INDEX "idx_project_domains_project_id" ON "public"."project_domains" USING "btree" ("project_id");



CREATE INDEX "idx_project_field_settings_sort_order" ON "public"."project_field_settings" USING "btree" ("project_id", "sort_order");



CREATE INDEX "idx_project_sync_settings_active" ON "public"."project_sync_settings" USING "btree" ("is_active", "status");



CREATE INDEX "idx_project_sync_settings_next_sync" ON "public"."project_sync_settings" USING "btree" ("next_sync");



CREATE INDEX "idx_project_sync_settings_project_id" ON "public"."project_sync_settings" USING "btree" ("project_id");



CREATE INDEX "idx_project_views_created_at" ON "public"."project_views" USING "btree" ("created_at");



CREATE INDEX "idx_project_views_project_id" ON "public"."project_views" USING "btree" ("project_id");



CREATE INDEX "idx_projects_coordinates" ON "public"."projects" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_projects_is_featured" ON "public"."projects" USING "btree" ("is_featured");



CREATE INDEX "idx_projects_is_public" ON "public"."projects" USING "btree" ("is_public");



CREATE INDEX "idx_projects_slug" ON "public"."projects" USING "btree" ("slug");



CREATE INDEX "idx_projects_subscription_expires" ON "public"."projects" USING "btree" ("subscription_expires_at");



CREATE INDEX "idx_projects_subscription_status" ON "public"."projects" USING "btree" ("subscription_status");



CREATE INDEX "idx_projects_user_id" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "idx_subscription_history_subscription_id" ON "public"."subscription_history" USING "btree" ("subscription_id");



CREATE INDEX "idx_subscription_history_user_id" ON "public"."subscription_history" USING "btree" ("user_id");



CREATE INDEX "idx_sync_logs_created_at" ON "public"."sync_logs" USING "btree" ("created_at");



CREATE INDEX "idx_sync_logs_project_id" ON "public"."sync_logs" USING "btree" ("project_id");



CREATE INDEX "idx_system_settings_key" ON "public"."system_settings" USING "btree" ("setting_key");



CREATE INDEX "idx_user_profiles_account_type" ON "public"."user_profiles" USING "btree" ("account_type");



CREATE INDEX "idx_user_subscriptions_invoice_number" ON "public"."user_subscriptions" USING "btree" ("invoice_number") WHERE ("invoice_number" IS NOT NULL);



CREATE INDEX "idx_user_subscriptions_invoice_requested" ON "public"."user_subscriptions" USING "btree" ("invoice_requested_at") WHERE ("invoice_requested_at" IS NOT NULL);



CREATE INDEX "idx_user_subscriptions_lemon_squeezy_id" ON "public"."user_subscriptions" USING "btree" ("lemon_squeezy_subscription_id");



CREATE INDEX "idx_user_subscriptions_payment_method" ON "public"."user_subscriptions" USING "btree" ("payment_method");



CREATE INDEX "idx_user_subscriptions_pending_payment" ON "public"."user_subscriptions" USING "btree" ("status") WHERE (("status")::"text" = 'pending_payment'::"text");



CREATE INDEX "idx_user_subscriptions_project_id" ON "public"."user_subscriptions" USING "btree" ("project_id");



CREATE INDEX "idx_user_subscriptions_status" ON "public"."user_subscriptions" USING "btree" ("status");



CREATE INDEX "idx_user_subscriptions_user_id" ON "public"."user_subscriptions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "user_subscriptions_user_project_unq" ON "public"."user_subscriptions" USING "btree" ("user_id", "project_id");



CREATE OR REPLACE TRIGGER "auto_initialize_project_fields" AFTER INSERT ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_initialize_default_fields"();



COMMENT ON TRIGGER "auto_initialize_project_fields" ON "public"."projects" IS 'Автоматически инициализирует стандартные поля для отображения квартир при создании нового проекта';



CREATE OR REPLACE TRIGGER "ensure_project_subscription" BEFORE INSERT ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."check_project_subscription"();



CREATE OR REPLACE TRIGGER "handle_leads_updated_at" BEFORE UPDATE ON "public"."leads" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_manager_account_created" AFTER INSERT ON "public"."manager_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_manager_account"();



CREATE OR REPLACE TRIGGER "on_manager_account_created_update_invitation" AFTER INSERT ON "public"."manager_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."handle_manager_account_created"();



CREATE OR REPLACE TRIGGER "sync_subscription_status" AFTER INSERT OR UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."sync_project_subscription_status"();



CREATE OR REPLACE TRIGGER "trigger_auto_generate_slug" BEFORE INSERT OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."auto_generate_slug"();



CREATE OR REPLACE TRIGGER "trigger_create_company_settings" AFTER INSERT ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_company_settings_for_user"();



CREATE OR REPLACE TRIGGER "trigger_project_domains_updated_at" BEFORE UPDATE ON "public"."project_domains" FOR EACH ROW EXECUTE FUNCTION "public"."update_project_domains_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_set_initial_next_sync" BEFORE INSERT ON "public"."project_sync_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_initial_next_sync"();



CREATE OR REPLACE TRIGGER "trigger_update_layout_photos_updated_at" BEFORE UPDATE ON "public"."layout_photos" FOR EACH ROW EXECUTE FUNCTION "public"."update_layout_photos_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_next_sync" BEFORE UPDATE ON "public"."project_sync_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_next_sync"();



CREATE OR REPLACE TRIGGER "update_amocrm_custom_fields_updated_at" BEFORE UPDATE ON "public"."amocrm_custom_fields" FOR EACH ROW EXECUTE FUNCTION "public"."update_amocrm_custom_fields_updated_at"();



CREATE OR REPLACE TRIGGER "update_amocrm_settings_updated_at" BEFORE UPDATE ON "public"."amocrm_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_company_settings_updated_at" BEFORE UPDATE ON "public"."company_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_manager_project_access_updated_at" BEFORE UPDATE ON "public"."manager_project_access" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscription_plans_updated_at" BEFORE UPDATE ON "public"."subscription_plans" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_roles_updated_at" BEFORE UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_subscriptions_updated_at" BEFORE UPDATE ON "public"."user_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."amocrm_custom_fields"
    ADD CONSTRAINT "amocrm_custom_fields_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."amocrm_settings"
    ADD CONSTRAINT "amocrm_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartment_photos"
    ADD CONSTRAINT "apartment_photos_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_floor_plan_id_fkey" FOREIGN KEY ("floor_plan_id") REFERENCES "public"."floor_plans"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."apartments"
    ADD CONSTRAINT "apartments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."banned_users"
    ADD CONSTRAINT "banned_users_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."banned_users"
    ADD CONSTRAINT "banned_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."building_floors"
    ADD CONSTRAINT "building_floors_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_settings"
    ADD CONSTRAINT "company_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manager_accounts"
    ADD CONSTRAINT "fk_manager_accounts_developer_profile" FOREIGN KEY ("developer_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "fk_projects_user_profile" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."floor_plans"
    ADD CONSTRAINT "floor_plans_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."layout_photos"
    ADD CONSTRAINT "layout_photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_apartment_id_fkey" FOREIGN KEY ("apartment_id") REFERENCES "public"."apartments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."leads"
    ADD CONSTRAINT "leads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manager_accounts"
    ADD CONSTRAINT "manager_accounts_developer_id_fkey" FOREIGN KEY ("developer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manager_accounts"
    ADD CONSTRAINT "manager_accounts_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manager_permissions"
    ADD CONSTRAINT "manager_permissions_manager_account_id_fkey" FOREIGN KEY ("manager_account_id") REFERENCES "public"."manager_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manager_project_access"
    ADD CONSTRAINT "manager_project_access_manager_account_id_fkey" FOREIGN KEY ("manager_account_id") REFERENCES "public"."manager_accounts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."manager_project_access"
    ADD CONSTRAINT "manager_project_access_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_custom_fields"
    ADD CONSTRAINT "project_custom_fields_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_domains"
    ADD CONSTRAINT "project_domains_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_field_settings"
    ADD CONSTRAINT "project_field_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_sync_settings"
    ADD CONSTRAINT "project_sync_settings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_views"
    ADD CONSTRAINT "project_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscription_history"
    ADD CONSTRAINT "subscription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_logs"
    ADD CONSTRAINT "sync_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sync_logs"
    ADD CONSTRAINT "sync_logs_sync_settings_id_fkey" FOREIGN KEY ("sync_settings_id") REFERENCES "public"."project_sync_settings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id");



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_subscriptions"
    ADD CONSTRAINT "user_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can insert project views" ON "public"."project_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view apartment photos from public projects" ON "public"."apartment_photos" FOR SELECT USING (("apartment_id" IN ( SELECT "a"."id"
   FROM ("public"."apartments" "a"
     JOIN "public"."projects" "p" ON (("a"."project_id" = "p"."id")))
  WHERE (("p"."is_public" = true) OR ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view apartments from public projects" ON "public"."apartments" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."is_public" = true) OR ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view custom fields" ON "public"."project_custom_fields" FOR SELECT USING (true);



CREATE POLICY "Anyone can view field settings" ON "public"."project_field_settings" FOR SELECT USING (true);



CREATE POLICY "Anyone can view floor plans from public projects" ON "public"."floor_plans" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."is_public" = true) OR ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Anyone can view layout photos" ON "public"."layout_photos" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can manage custom fields" ON "public"."project_custom_fields" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage field settings" ON "public"."project_field_settings" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can manage layout photos" ON "public"."layout_photos" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Developers can create manager accounts" ON "public"."manager_accounts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "developer_id"));



CREATE POLICY "Developers can create permissions for their managers" ON "public"."manager_permissions" FOR INSERT WITH CHECK (("manager_account_id" IN ( SELECT "manager_accounts"."id"
   FROM "public"."manager_accounts"
  WHERE ("manager_accounts"."developer_id" = "auth"."uid"()))));



CREATE POLICY "Developers can delete permissions for their managers" ON "public"."manager_permissions" FOR DELETE USING (("manager_account_id" IN ( SELECT "manager_accounts"."id"
   FROM "public"."manager_accounts"
  WHERE ("manager_accounts"."developer_id" = "auth"."uid"()))));



CREATE POLICY "Developers can delete their manager accounts" ON "public"."manager_accounts" FOR DELETE USING (("auth"."uid"() = "developer_id"));



CREATE POLICY "Developers can manage their managers' project access" ON "public"."manager_project_access" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."manager_accounts" "ma"
  WHERE (("ma"."id" = "manager_project_access"."manager_account_id") AND ("ma"."developer_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."manager_accounts" "ma"
  WHERE (("ma"."id" = "manager_project_access"."manager_account_id") AND ("ma"."developer_id" = "auth"."uid"())))));



CREATE POLICY "Developers can update permissions for their managers" ON "public"."manager_permissions" FOR UPDATE USING (("manager_account_id" IN ( SELECT "manager_accounts"."id"
   FROM "public"."manager_accounts"
  WHERE ("manager_accounts"."developer_id" = "auth"."uid"()))));



CREATE POLICY "Developers can update their manager accounts" ON "public"."manager_accounts" FOR UPDATE USING (("auth"."uid"() = "developer_id"));



CREATE POLICY "Developers can view permissions for their managers" ON "public"."manager_permissions" FOR SELECT USING (("manager_account_id" IN ( SELECT "manager_accounts"."id"
   FROM "public"."manager_accounts"
  WHERE ("manager_accounts"."developer_id" = "auth"."uid"()))));



CREATE POLICY "Developers can view their manager accounts" ON "public"."manager_accounts" FOR SELECT USING (("auth"."uid"() = "developer_id"));



CREATE POLICY "Developers can view their managers' project access" ON "public"."manager_project_access" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."manager_accounts" "ma"
  WHERE (("ma"."id" = "manager_project_access"."manager_account_id") AND ("ma"."developer_id" = "auth"."uid"())))));



CREATE POLICY "Enable delete access for all users" ON "public"."apartments" FOR DELETE USING (true);



CREATE POLICY "Enable delete access for all users" ON "public"."building_floors" FOR DELETE USING (true);



CREATE POLICY "Enable delete access for all users" ON "public"."floor_plans" FOR DELETE USING (true);



CREATE POLICY "Enable insert access for all users" ON "public"."apartments" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert access for all users" ON "public"."building_floors" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert access for all users" ON "public"."floor_plans" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."apartments" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."building_floors" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."floor_plans" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."apartments" FOR UPDATE USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."building_floors" FOR UPDATE USING (true);



CREATE POLICY "Enable update access for all users" ON "public"."floor_plans" FOR UPDATE USING (true);



CREATE POLICY "Managers can create leads for accessible projects" ON "public"."leads" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (("public"."projects" "p"
     JOIN "public"."manager_accounts" "ma" ON (("ma"."developer_id" = "p"."user_id")))
     JOIN "public"."manager_project_access" "mpa" ON (("mpa"."manager_account_id" = "ma"."id")))
  WHERE (("p"."id" = "leads"."project_id") AND ("ma"."manager_id" = "auth"."uid"()) AND ("ma"."status" = 'active'::"text") AND ("mpa"."project_id" = "p"."id")))));



CREATE POLICY "Managers can create projects for their developers" ON "public"."projects" FOR INSERT WITH CHECK (("user_id" IN ( SELECT "manager_accounts"."developer_id"
   FROM "public"."manager_accounts"
  WHERE (("manager_accounts"."manager_id" = "auth"."uid"()) AND ("manager_accounts"."status" = 'active'::"text") AND ("manager_accounts"."id" IN ( SELECT "manager_permissions"."manager_account_id"
           FROM "public"."manager_permissions"
          WHERE (("manager_permissions"."permission_type" = 'create_projects'::"text") AND ("manager_permissions"."allowed" = true))))))));



CREATE POLICY "Managers can update leads for accessible projects" ON "public"."leads" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM (("public"."projects" "p"
     JOIN "public"."manager_accounts" "ma" ON (("ma"."developer_id" = "p"."user_id")))
     JOIN "public"."manager_project_access" "mpa" ON (("mpa"."manager_account_id" = "ma"."id")))
  WHERE (("p"."id" = "leads"."project_id") AND ("ma"."manager_id" = "auth"."uid"()) AND ("ma"."status" = 'active'::"text") AND ("mpa"."project_id" = "p"."id")))));



CREATE POLICY "Managers can view leads for accessible projects" ON "public"."leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."projects" "p"
     JOIN "public"."manager_accounts" "ma" ON (("ma"."developer_id" = "p"."user_id")))
     JOIN "public"."manager_project_access" "mpa" ON (("mpa"."manager_account_id" = "ma"."id")))
  WHERE (("p"."id" = "leads"."project_id") AND ("ma"."manager_id" = "auth"."uid"()) AND ("ma"."status" = 'active'::"text") AND ("mpa"."project_id" = "p"."id")))));



CREATE POLICY "Managers can view related developer profiles" ON "public"."user_profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."manager_accounts"
  WHERE (("manager_accounts"."developer_id" = "user_profiles"."id") AND ("manager_accounts"."manager_id" = "auth"."uid"())))));



CREATE POLICY "Managers can view their own account" ON "public"."manager_accounts" FOR SELECT USING (("auth"."uid"() = "manager_id"));



CREATE POLICY "Managers can view their own permissions" ON "public"."manager_permissions" FOR SELECT USING (("manager_account_id" IN ( SELECT "manager_accounts"."id"
   FROM "public"."manager_accounts"
  WHERE ("manager_accounts"."manager_id" = "auth"."uid"()))));



CREATE POLICY "Managers can view their own project access" ON "public"."manager_project_access" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."manager_accounts" "ma"
  WHERE (("ma"."id" = "manager_project_access"."manager_account_id") AND ("ma"."manager_id" = "auth"."uid"())))));



CREATE POLICY "Only project owners can delete projects" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Project owners can create apartments" ON "public"."apartments" FOR INSERT WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can create floor plans" ON "public"."floor_plans" FOR INSERT WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can delete apartment photos" ON "public"."apartment_photos" FOR DELETE USING (("apartment_id" IN ( SELECT "a"."id"
   FROM ("public"."apartments" "a"
     JOIN "public"."projects" "p" ON (("a"."project_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can delete apartments" ON "public"."apartments" FOR DELETE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can delete floor plans" ON "public"."floor_plans" FOR DELETE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can manage project subscriptions" ON "public"."user_subscriptions" FOR UPDATE TO "authenticated" USING ((("project_id" IS NOT NULL) AND "public"."is_project_owner"("auth"."uid"(), "project_id"))) WITH CHECK ((("project_id" IS NOT NULL) AND "public"."is_project_owner"("auth"."uid"(), "project_id")));



CREATE POLICY "Project owners can update apartment photos" ON "public"."apartment_photos" FOR UPDATE USING (("apartment_id" IN ( SELECT "a"."id"
   FROM ("public"."apartments" "a"
     JOIN "public"."projects" "p" ON (("a"."project_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can update apartments" ON "public"."apartments" FOR UPDATE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can update floor plans" ON "public"."floor_plans" FOR UPDATE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can upload apartment photos" ON "public"."apartment_photos" FOR INSERT WITH CHECK (("apartment_id" IN ( SELECT "a"."id"
   FROM ("public"."apartments" "a"
     JOIN "public"."projects" "p" ON (("a"."project_id" = "p"."id")))
  WHERE ("p"."user_id" = "auth"."uid"()))));



CREATE POLICY "Project owners can view project subscriptions" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ((("project_id" IS NOT NULL) AND "public"."is_project_owner"("auth"."uid"(), "project_id")));



CREATE POLICY "Project owners can view their project analytics" ON "public"."project_views" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Public can view custom fields for public projects" ON "public"."project_custom_fields" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."is_public" = true) OR ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Public can view field settings for public projects" ON "public"."project_field_settings" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."is_public" = true) OR ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Public can view public projects" ON "public"."projects" FOR SELECT TO "authenticated", "anon" USING (("is_public" = true));



CREATE POLICY "Public visible projects are viewable" ON "public"."projects" FOR SELECT USING ((("is_public" = true) AND ("is_public_visible" = true)));



CREATE POLICY "Service role can access all leads" ON "public"."leads" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Subscription discounts are viewable by everyone" ON "public"."subscription_discounts" FOR SELECT USING (true);



CREATE POLICY "Subscription plans are viewable by everyone" ON "public"."subscription_plans" FOR SELECT USING (true);



CREATE POLICY "Super admins can manage system settings" ON "public"."system_settings" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can delete roles" ON "public"."user_roles" FOR DELETE TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can insert roles" ON "public"."user_roles" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can manage all subscriptions" ON "public"."user_subscriptions" TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"())) WITH CHECK ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can manage banned users" ON "public"."banned_users" TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"())) WITH CHECK ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can update all profiles" ON "public"."user_profiles" FOR UPDATE TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can update all projects" ON "public"."projects" FOR UPDATE TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can update roles" ON "public"."user_roles" FOR UPDATE TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can view all profiles" ON "public"."user_profiles" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can view all projects" ON "public"."projects" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can view all roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can view all subscriptions" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "Superadmins can view banned users" ON "public"."banned_users" FOR SELECT TO "authenticated" USING ("public"."is_superadmin"("auth"."uid"()));



CREATE POLICY "TEMP_ALLOW_ALL_INSERT" ON "public"."manager_accounts" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users and managers can update projects" ON "public"."projects" FOR UPDATE USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "ma"."manager_id"
   FROM ("public"."manager_accounts" "ma"
     JOIN "public"."manager_permissions" "mp" ON (("ma"."id" = "mp"."manager_account_id")))
  WHERE (("ma"."developer_id" = "projects"."user_id") AND ("ma"."status" = 'active'::"text") AND ("mp"."permission_type" = 'edit_projects'::"text") AND ("mp"."allowed" = true))))));



CREATE POLICY "Users and managers can view projects" ON "public"."projects" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "manager_accounts"."manager_id"
   FROM "public"."manager_accounts"
  WHERE (("manager_accounts"."developer_id" = "projects"."user_id") AND ("manager_accounts"."status" = 'active'::"text"))))));



CREATE POLICY "Users can create leads for their projects" ON "public"."leads" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "leads"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own AmoCRM settings" ON "public"."amocrm_settings" FOR DELETE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert AmoCRM settings for their projects" ON "public"."amocrm_settings" FOR INSERT WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert sync settings for their projects" ON "public"."project_sync_settings" FOR INSERT WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "project_sync_settings"."project_id"))));



CREATE POLICY "Users can insert their own company settings" ON "public"."company_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage amocrm custom fields for their projects" ON "public"."amocrm_custom_fields" USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."user_id" = "auth"."uid"()) OR ("projects"."id" IN ( SELECT "amocrm_custom_fields"."project_id"
           FROM "public"."manager_accounts"
          WHERE ("projects"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can update leads for their projects" ON "public"."leads" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "leads"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can update sync settings for their projects" ON "public"."project_sync_settings" FOR UPDATE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "project_sync_settings"."project_id")))) WITH CHECK (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "project_sync_settings"."project_id"))));



CREATE POLICY "Users can update their own AmoCRM settings" ON "public"."amocrm_settings" FOR UPDATE USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can update their own company settings" ON "public"."company_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view amocrm custom fields for their projects" ON "public"."amocrm_custom_fields" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."user_id" = "auth"."uid"()) OR ("projects"."id" IN ( SELECT "amocrm_custom_fields"."project_id"
           FROM "public"."manager_accounts"
          WHERE ("projects"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can view leads for their projects" ON "public"."leads" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "leads"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own AmoCRM settings" ON "public"."amocrm_settings" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own company settings" ON "public"."company_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own projects" ON "public"."projects" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own subscription history" ON "public"."subscription_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their project subscriptions" ON "public"."user_subscriptions" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their project sync settings" ON "public"."project_sync_settings" FOR SELECT USING (("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."id" = "project_sync_settings"."project_id"))));



CREATE POLICY "allow_read_domains" ON "public"."project_domains" FOR SELECT USING (true);



ALTER TABLE "public"."amocrm_custom_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."amocrm_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."apartment_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."apartments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."banned_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."building_floors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."company_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."floor_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."layout_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."leads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manager_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manager_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."manager_project_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "owner_manage_domains" ON "public"."project_domains" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_domains"."project_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_domains"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."project_custom_fields" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_field_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_sync_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_discounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscription_plans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sync_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auto_generate_slug"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_generate_slug"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_generate_slug"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_project_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_project_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_project_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_invitations"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_invitations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_invitations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_company_settings_for_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_company_settings_for_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_company_settings_for_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_manager_permissions"("manager_account_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_manager_permissions"("manager_account_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_manager_permissions"("manager_account_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_unique_slug"("base_slug" "text", "project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_unique_slug"("base_slug" "text", "project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_unique_slug"("base_slug" "text", "project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invitation_token"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_manager_account_created"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_manager_account_created"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_manager_account_created"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_manager_account"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_manager_account"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_manager_account"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_view_count"("project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view_count"("project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view_count"("project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_default_fields"("p_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_default_fields"("p_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_default_fields"("p_project_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."amocrm_settings" TO "anon";
GRANT ALL ON TABLE "public"."amocrm_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."amocrm_settings" TO "service_role";



GRANT ALL ON FUNCTION "public"."is_amocrm_configured"("settings_row" "public"."amocrm_settings") TO "anon";
GRANT ALL ON FUNCTION "public"."is_amocrm_configured"("settings_row" "public"."amocrm_settings") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_amocrm_configured"("settings_row" "public"."amocrm_settings") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_owner"("_user_id" "uuid", "_project_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_owner"("_user_id" "uuid", "_project_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_owner"("_user_id" "uuid", "_project_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_superadmin"("_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_superadmin"("_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_superadmin"("_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."needs_token_refresh"("settings_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."needs_token_refresh"("settings_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."needs_token_refresh"("settings_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_initial_next_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_initial_next_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_initial_next_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."start_trial_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."start_trial_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_trial_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_project_subscription_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_project_subscription_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_project_subscription_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_initialize_default_fields"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_initialize_default_fields"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_initialize_default_fields"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_amocrm_custom_fields_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_amocrm_custom_fields_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_amocrm_custom_fields_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_layout_photos_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_layout_photos_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_layout_photos_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_next_sync"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_next_sync"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_next_sync"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_domains_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_domains_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_domains_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_amocrm_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_amocrm_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_amocrm_settings"() TO "service_role";


















GRANT ALL ON TABLE "public"."amocrm_custom_fields" TO "anon";
GRANT ALL ON TABLE "public"."amocrm_custom_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."amocrm_custom_fields" TO "service_role";



GRANT ALL ON TABLE "public"."apartment_photos" TO "anon";
GRANT ALL ON TABLE "public"."apartment_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."apartment_photos" TO "service_role";



GRANT ALL ON TABLE "public"."apartments" TO "anon";
GRANT ALL ON TABLE "public"."apartments" TO "authenticated";
GRANT ALL ON TABLE "public"."apartments" TO "service_role";



GRANT ALL ON TABLE "public"."banned_users" TO "anon";
GRANT ALL ON TABLE "public"."banned_users" TO "authenticated";
GRANT ALL ON TABLE "public"."banned_users" TO "service_role";



GRANT ALL ON TABLE "public"."building_floors" TO "anon";
GRANT ALL ON TABLE "public"."building_floors" TO "authenticated";
GRANT ALL ON TABLE "public"."building_floors" TO "service_role";



GRANT ALL ON TABLE "public"."company_settings" TO "anon";
GRANT ALL ON TABLE "public"."company_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."company_settings" TO "service_role";



GRANT ALL ON TABLE "public"."floor_plans" TO "anon";
GRANT ALL ON TABLE "public"."floor_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."floor_plans" TO "service_role";



GRANT ALL ON TABLE "public"."layout_photos" TO "anon";
GRANT ALL ON TABLE "public"."layout_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."layout_photos" TO "service_role";



GRANT ALL ON TABLE "public"."leads" TO "anon";
GRANT ALL ON TABLE "public"."leads" TO "authenticated";
GRANT ALL ON TABLE "public"."leads" TO "service_role";



GRANT ALL ON TABLE "public"."manager_accounts" TO "anon";
GRANT ALL ON TABLE "public"."manager_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."manager_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."manager_permissions" TO "anon";
GRANT ALL ON TABLE "public"."manager_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."manager_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."manager_project_access" TO "anon";
GRANT ALL ON TABLE "public"."manager_project_access" TO "authenticated";
GRANT ALL ON TABLE "public"."manager_project_access" TO "service_role";



GRANT ALL ON TABLE "public"."project_custom_fields" TO "anon";
GRANT ALL ON TABLE "public"."project_custom_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."project_custom_fields" TO "service_role";



GRANT ALL ON TABLE "public"."project_domains" TO "anon";
GRANT ALL ON TABLE "public"."project_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."project_domains" TO "service_role";



GRANT ALL ON TABLE "public"."project_field_settings" TO "anon";
GRANT ALL ON TABLE "public"."project_field_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."project_field_settings" TO "service_role";



GRANT ALL ON TABLE "public"."project_sync_settings" TO "anon";
GRANT ALL ON TABLE "public"."project_sync_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."project_sync_settings" TO "service_role";



GRANT ALL ON TABLE "public"."project_views" TO "anon";
GRANT ALL ON TABLE "public"."project_views" TO "authenticated";
GRANT ALL ON TABLE "public"."project_views" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_discounts" TO "anon";
GRANT ALL ON TABLE "public"."subscription_discounts" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_discounts" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_history" TO "anon";
GRANT ALL ON TABLE "public"."subscription_history" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_history" TO "service_role";



GRANT ALL ON TABLE "public"."subscription_plans" TO "anon";
GRANT ALL ON TABLE "public"."subscription_plans" TO "authenticated";
GRANT ALL ON TABLE "public"."subscription_plans" TO "service_role";



GRANT ALL ON TABLE "public"."sync_logs" TO "anon";
GRANT ALL ON TABLE "public"."sync_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."sync_logs" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_subscriptions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER start_trial_on_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION start_trial_subscription();


  create policy "Anyone can view project images"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'project-images'::text));



  create policy "Authenticated users can delete project images"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can update project images"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Authenticated users can upload project images"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'project-images'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Users can delete their PDF files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can update their PDF files"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can upload PDF files"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



  create policy "Users can view their PDF files"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'project-files'::text) AND (auth.uid() IS NOT NULL) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



