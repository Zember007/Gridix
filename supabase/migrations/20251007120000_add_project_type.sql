-- Add project_type enum and column to projects
DO $$ BEGIN
  CREATE TYPE project_type AS ENUM ('building', 'object');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_type project_type NOT NULL DEFAULT 'building';

-- Ensure default for existing rows
UPDATE public.projects SET project_type = 'building' WHERE project_type IS NULL;

