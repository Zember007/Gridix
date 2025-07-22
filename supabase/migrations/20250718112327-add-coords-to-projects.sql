-- Добавление координат к проектам (latitude, longitude)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Индекс для быстрого поиска по координатам
CREATE INDEX IF NOT EXISTS idx_projects_lat_lng ON public.projects(latitude, longitude); 