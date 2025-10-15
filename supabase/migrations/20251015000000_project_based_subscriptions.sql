-- Migration: Project-based Subscriptions
-- This migration transforms subscriptions from user-level to project-level

-- Step 1: Drop the unique constraint on user_id to allow multiple subscriptions per user
ALTER TABLE public.user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key;

-- Step 2: Add new columns to user_subscriptions table
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS invoice_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_paid_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Add subscription status fields to projects table
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_public_visible BOOLEAN DEFAULT true;

-- Step 4: Migrate existing user subscriptions to all their projects
-- For each user with a subscription, create a subscription entry for each of their projects
DO $$
DECLARE
  sub_record RECORD;
  proj_record RECORD;
BEGIN
  -- Loop through all existing subscriptions that don't have a project_id yet
  FOR sub_record IN 
    SELECT * FROM public.user_subscriptions WHERE project_id IS NULL
  LOOP
    -- For each subscription, find all projects owned by that user
    FOR proj_record IN 
      SELECT id FROM public.projects WHERE user_id = sub_record.user_id
    LOOP
      -- Update the first project with this subscription
      IF NOT EXISTS (
        SELECT 1 FROM public.user_subscriptions 
        WHERE project_id = proj_record.id
      ) THEN
        -- Clone the subscription for this project
        INSERT INTO public.user_subscriptions (
          user_id,
          project_id,
          plan_id,
          lemon_squeezy_subscription_id,
          lemon_squeezy_customer_id,
          status,
          trial_ends_at,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          cancelled_at,
          duration_months,
          discount_percentage,
          final_price,
          created_at,
          updated_at
        )
        VALUES (
          sub_record.user_id,
          proj_record.id,
          sub_record.plan_id,
          sub_record.lemon_squeezy_subscription_id,
          sub_record.lemon_squeezy_customer_id,
          sub_record.status,
          sub_record.trial_ends_at,
          sub_record.current_period_start,
          sub_record.current_period_end,
          sub_record.cancel_at_period_end,
          sub_record.cancelled_at,
          sub_record.duration_months,
          sub_record.discount_percentage,
          sub_record.final_price,
          sub_record.created_at,
          sub_record.updated_at
        );
        
        -- Update the project with subscription status
        UPDATE public.projects
        SET 
          subscription_status = sub_record.status,
          subscription_expires_at = sub_record.current_period_end,
          is_public_visible = CASE 
            WHEN sub_record.status IN ('active', 'trialing') THEN true
            ELSE false
          END
        WHERE id = proj_record.id;
      END IF;
    END LOOP;
    
    -- Mark the old subscription for deletion (we'll keep it for reference but mark it)
    UPDATE public.user_subscriptions
    SET status = 'migrated'
    WHERE id = sub_record.id AND project_id IS NULL;
  END LOOP;
END $$;

-- Step 5: Add unique constraint on (user_id, project_id) to prevent duplicate subscriptions per project
-- This replaces the old user_id unique constraint and allows multiple subscriptions per user (one per project)
ALTER TABLE public.user_subscriptions
DROP CONSTRAINT IF EXISTS user_subscriptions_user_project_unique;

ALTER TABLE public.user_subscriptions
ADD CONSTRAINT user_subscriptions_user_project_unique 
UNIQUE (user_id, project_id);

-- Step 6: Make project_id required for new subscriptions
-- We don't make it NOT NULL yet to preserve old migrated records
-- But we add a check constraint for new records
CREATE OR REPLACE FUNCTION check_project_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NULL AND NEW.status != 'migrated' THEN
    RAISE EXCEPTION 'project_id is required for new subscriptions';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_project_subscription
BEFORE INSERT ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION check_project_subscription();

-- Step 7: Update RLS policies for project-level subscriptions
-- Allow users to view their own project subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can view their project subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  project_id IN (
    SELECT id FROM public.projects WHERE user_id = auth.uid()
  )
);

-- Allow users to view their own projects
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow public to view public visible projects only
DROP POLICY IF EXISTS "Public projects are viewable by everyone" ON public.projects;
CREATE POLICY "Public visible projects are viewable"
ON public.projects
FOR SELECT
TO public
USING (is_public = true AND is_public_visible = true);

-- Step 8: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_project_id ON public.user_subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_projects_subscription_status ON public.projects(subscription_status);
CREATE INDEX IF NOT EXISTS idx_projects_subscription_expires ON public.projects(subscription_expires_at);

-- Step 9: Create a function to sync project subscription status
CREATE OR REPLACE FUNCTION sync_project_subscription_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_subscription_status
AFTER INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_project_subscription_status();

-- Step 10: Add comment for documentation
COMMENT ON COLUMN user_subscriptions.project_id IS 'Links subscription to a specific project. Required for all new subscriptions.';
COMMENT ON COLUMN user_subscriptions.invoice_number IS 'Manual invoice number for tracking payments';
COMMENT ON COLUMN user_subscriptions.invoice_url IS 'URL to the invoice document/PDF';
COMMENT ON COLUMN user_subscriptions.invoice_requested_at IS 'Timestamp when user requested an invoice';
COMMENT ON COLUMN user_subscriptions.invoice_paid_at IS 'Timestamp when invoice was marked as paid';
COMMENT ON COLUMN projects.subscription_status IS 'Current subscription status for this project';
COMMENT ON COLUMN projects.subscription_expires_at IS 'When the project subscription expires';
COMMENT ON COLUMN projects.is_public_visible IS 'Whether project should appear in public gallery (based on subscription)';

