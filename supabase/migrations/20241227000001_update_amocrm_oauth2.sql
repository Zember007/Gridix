-- Update AmoCRM settings table for OAuth2
ALTER TABLE amocrm_settings DROP COLUMN IF EXISTS api_key;

-- Add OAuth2 fields
ALTER TABLE amocrm_settings ADD COLUMN client_id TEXT;
ALTER TABLE amocrm_settings ADD COLUMN client_secret TEXT;
ALTER TABLE amocrm_settings ADD COLUMN access_token TEXT;
ALTER TABLE amocrm_settings ADD COLUMN refresh_token TEXT;
ALTER TABLE amocrm_settings ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE amocrm_settings ADD COLUMN authorization_code TEXT;
ALTER TABLE amocrm_settings ADD COLUMN redirect_uri TEXT;

-- Make client_id and client_secret required
ALTER TABLE amocrm_settings ALTER COLUMN client_id SET NOT NULL;
ALTER TABLE amocrm_settings ALTER COLUMN client_secret SET NOT NULL;

-- Create index for token expiration checks
CREATE INDEX idx_amocrm_token_expiration ON amocrm_settings(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- Add function to check if token needs refresh
CREATE OR REPLACE FUNCTION needs_token_refresh(settings_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT token_expires_at INTO expires_at
    FROM amocrm_settings
    WHERE id = settings_id;
    
    -- Return true if token expires within next 5 minutes or already expired
    RETURN expires_at IS NULL OR expires_at <= NOW() + INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
