
-- Добавляем координаты для проектов
ALTER TABLE public.projects 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN address TEXT;

-- Добавляем индекс для поиска по координатам
CREATE INDEX idx_projects_coordinates ON public.projects(latitude, longitude);
