-- Add fields for storing AmoCRM entity names for display purposes
ALTER TABLE amocrm_settings ADD COLUMN pipeline_name TEXT;
ALTER TABLE amocrm_settings ADD COLUMN status_name TEXT;
ALTER TABLE amocrm_settings ADD COLUMN user_name TEXT;
ALTER TABLE amocrm_settings ADD COLUMN account_name TEXT;

-- Make client_id and client_secret optional since they'll be managed by the system
ALTER TABLE amocrm_settings ALTER COLUMN client_id DROP NOT NULL;
ALTER TABLE amocrm_settings ALTER COLUMN client_secret DROP NOT NULL;

-- Update the validation function to handle the new simplified flow
CREATE OR REPLACE FUNCTION validate_amocrm_settings()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Add helpful comments for new fields
COMMENT ON COLUMN amocrm_settings.pipeline_name IS 'Display name of the selected pipeline';
COMMENT ON COLUMN amocrm_settings.status_name IS 'Display name of the selected status';
COMMENT ON COLUMN amocrm_settings.user_name IS 'Display name of the responsible user';
COMMENT ON COLUMN amocrm_settings.account_name IS 'Display name of the AmoCRM account';

-- Function to check if AmoCRM integration is fully configured
CREATE OR REPLACE FUNCTION is_amocrm_configured(settings_row amocrm_settings)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN settings_row.access_token IS NOT NULL 
           AND settings_row.refresh_token IS NOT NULL
           AND settings_row.token_expires_at IS NOT NULL
           AND settings_row.token_expires_at > NOW()
           AND settings_row.pipeline_id IS NOT NULL
           AND settings_row.pipeline_id > 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update the constraints to be more flexible
ALTER TABLE amocrm_settings DROP CONSTRAINT IF EXISTS check_pipeline_id_positive;
ALTER TABLE amocrm_settings ADD CONSTRAINT check_pipeline_id_positive 
  CHECK (pipeline_id IS NULL OR pipeline_id > 0);
