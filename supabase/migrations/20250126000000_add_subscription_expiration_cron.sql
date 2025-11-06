-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Function to check and expire subscriptions
CREATE OR REPLACE FUNCTION public.check_and_expire_subscriptions()
RETURNS TABLE(expired_count integer, trial_expired_count integer, updated_subscriptions uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_subscriptions uuid[];
  expired_count integer;
  trial_expired_count integer;
BEGIN
  -- Find and update all active subscriptions that have expired
  WITH expired_subs AS (
    UPDATE user_subscriptions
    SET 
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'active'
      AND current_period_end IS NOT NULL
      AND current_period_end < NOW()
    RETURNING id, user_id, current_period_end
  )
  SELECT array_agg(id), COUNT(*) INTO expired_subscriptions, expired_count
  FROM expired_subs;
  
  -- Log expirations in subscription_history
  IF expired_count > 0 AND expired_subscriptions IS NOT NULL THEN
    INSERT INTO subscription_history (
      user_id,
      subscription_id,
      action,
      old_status,
      new_status,
      metadata
    )
    SELECT 
      us.user_id,
      us.id,
      'subscription_expired',
      'active',
      'expired',
      jsonb_build_object(
        'expired_at', NOW(),
        'period_end', us.current_period_end
      )
    FROM user_subscriptions us
    WHERE us.id = ANY(expired_subscriptions);
  END IF;
  
  -- Check and expire trial subscriptions
  WITH trial_expired_subs AS (
    UPDATE user_subscriptions
    SET 
      status = 'trial_expired',
      updated_at = NOW()
    WHERE status = 'trialing'
      AND trial_ends_at IS NOT NULL
      AND trial_ends_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO trial_expired_count
  FROM trial_expired_subs;
  
  -- The sync_project_subscription_status trigger will automatically update project statuses
  
  RETURN QUERY SELECT expired_count, trial_expired_count, expired_subscriptions;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_and_expire_subscriptions() TO postgres;
GRANT EXECUTE ON FUNCTION public.check_and_expire_subscriptions() TO service_role;

-- Schedule cron job to run daily at midnight (00:00 UTC)
-- Note: Supabase uses UTC timezone
-- First, try to unschedule any existing job with the same name (if it exists)
DO $$
BEGIN
  -- Try to unschedule existing job if it exists (ignore errors)
  BEGIN
    PERFORM cron.unschedule('check-expired-subscriptions');
  EXCEPTION WHEN OTHERS THEN
    -- Job doesn't exist, that's fine
    NULL;
  END;
END $$;

-- Schedule the cron job
-- Try with cron.schedule first (if pg_cron is in public schema)
DO $$
DECLARE
  job_id bigint;
BEGIN
  BEGIN
    SELECT cron.schedule(
      'check-expired-subscriptions',
      '0 0 * * *',
      'SELECT public.check_and_expire_subscriptions();'
    ) INTO job_id;
    RAISE NOTICE 'Cron job scheduled with ID: %', job_id;
  EXCEPTION WHEN OTHERS THEN
    -- If that doesn't work, try extensions.cron.schedule
    BEGIN
      SELECT extensions.cron.schedule(
        'check-expired-subscriptions',
        '0 0 * * *',
        'SELECT public.check_and_expire_subscriptions();'
      ) INTO job_id;
      RAISE NOTICE 'Cron job scheduled with ID: % (using extensions schema)', job_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not schedule cron job. pg_cron may not be available. Error: %', SQLERRM;
    END;
  END;
END $$;

-- Comment on function
COMMENT ON FUNCTION public.check_and_expire_subscriptions() IS 
'Checks for expired subscriptions and updates their status to expired. Runs daily at midnight via pg_cron.';

