-- Add per-project available languages for UI language switcher
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS available_languages text[] NOT NULL DEFAULT ARRAY['en','ru','ka','ar']::text[];

-- Ensure at least one language is selected
DO $$
BEGIN
  ALTER TABLE public.projects
  ADD CONSTRAINT projects_available_languages_nonempty
  CHECK (array_length(available_languages, 1) >= 1);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure only supported languages are used
DO $$
BEGIN
  ALTER TABLE public.projects
  ADD CONSTRAINT projects_available_languages_supported
  CHECK (available_languages <@ ARRAY['en','ru','ka','ar']::text[]);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

