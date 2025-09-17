-- Extend amocrm_settings to match usage in edge functions and store OAuth tokens

ALTER TABLE public.amocrm_settings 
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS client_secret TEXT,
  ADD COLUMN IF NOT EXISTS redirect_uri TEXT,
  ADD COLUMN IF NOT EXISTS authorization_code TEXT,
  ADD COLUMN IF NOT EXISTS access_token TEXT,
  ADD COLUMN IF NOT EXISTS refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pipeline_name TEXT;

-- Optional: ensure subdomain is NOT NULL for proper API calls
ALTER TABLE public.amocrm_settings 
  ALTER COLUMN subdomain SET NOT NULL;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.amocrm_settings ENABLE ROW LEVEL SECURITY;


