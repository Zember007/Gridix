-- Fix: Create manager_invitations table if it doesn't exist
-- The invitation system is deprecated, but a database trigger may still reference this table
-- This migration creates a minimal table structure to prevent errors

CREATE TABLE IF NOT EXISTS public.manager_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    developer_id UUID NOT NULL,
    invitation_token TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_manager_invitations_email ON public.manager_invitations(email);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_developer_id ON public.manager_invitations(developer_id);
CREATE INDEX IF NOT EXISTS idx_manager_invitations_token ON public.manager_invitations(invitation_token) WHERE invitation_token IS NOT NULL;

-- Add comment to indicate this table is deprecated
COMMENT ON TABLE public.manager_invitations IS 'DEPRECATED: This table is no longer actively used by the application. Kept for backward compatibility with existing database triggers.';

-- Optional: If you want to remove the trigger instead, uncomment and modify the following:
-- DO $$
-- DECLARE
--     r RECORD;
-- BEGIN
--     FOR r IN (
--         SELECT trigger_name
--         FROM information_schema.triggers
--         WHERE event_object_table = 'manager_accounts'
--         AND trigger_schema = 'public'
--         AND action_statement LIKE '%manager_invitations%'
--     ) LOOP
--         EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON manager_accounts';
--         RAISE NOTICE 'Dropped trigger: %', r.trigger_name;
--     END LOOP;
-- END $$;

