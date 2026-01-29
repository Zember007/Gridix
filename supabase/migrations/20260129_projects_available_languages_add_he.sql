-- Allow Hebrew in projects.available_languages
DO $$
BEGIN
  ALTER TABLE public.projects
    DROP CONSTRAINT IF EXISTS projects_available_languages_supported;

  ALTER TABLE public.projects
    ADD CONSTRAINT projects_available_languages_supported
    CHECK (available_languages <@ ARRAY['en','ru','ka','ar','he']::text[]);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Align default with supported languages
ALTER TABLE public.projects
  ALTER COLUMN available_languages
  SET DEFAULT ARRAY['en','ru','ka','ar','he']::text[];

