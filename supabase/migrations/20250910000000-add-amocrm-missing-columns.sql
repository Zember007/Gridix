-- Add missing columns to amocrm_settings table for OAuth callback
-- These columns are needed by the amocrm-oauth-callback function

-- Add base_domain column to store the full AmoCRM domain (e.g., 'georgiib722.amocrm.ru')
ALTER TABLE amocrm_settings ADD COLUMN IF NOT EXISTS base_domain TEXT;

-- Ensure subdomain column exists (it should already exist from previous migrations)
-- This stores just the subdomain part (e.g., 'georgiib722')
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'amocrm_settings' AND column_name = 'subdomain') THEN
        ALTER TABLE amocrm_settings ADD COLUMN subdomain TEXT;
    END IF;
END $$;

-- Add helpful comments
COMMENT ON COLUMN amocrm_settings.base_domain IS 'Full AmoCRM domain (e.g., georgiib722.amocrm.ru)';
COMMENT ON COLUMN amocrm_settings.subdomain IS 'AmoCRM subdomain part only (e.g., georgiib722)';
