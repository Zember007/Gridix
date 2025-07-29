-- Создание таблицы для фотографий планировок
CREATE TABLE IF NOT EXISTS public.layout_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL, -- например: "studio", "1-room", "2-room", etc.
  image_url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Уникальность: один порядковый индекс для каждого типа планировки в проекте
  UNIQUE(project_id, layout_type, order_index)
);

-- Включение RLS для таблицы фотографий планировок
ALTER TABLE public.layout_photos ENABLE ROW LEVEL SECURITY;

-- Политики для layout_photos
CREATE POLICY "Enable all operations for layout_photos" 
  ON public.layout_photos 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_layout_photos_project_id ON public.layout_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_layout_photos_layout_type ON public.layout_photos(project_id, layout_type);
CREATE INDEX IF NOT EXISTS idx_layout_photos_order_index ON public.layout_photos(project_id, layout_type, order_index);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_layout_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER trigger_update_layout_photos_updated_at
  BEFORE UPDATE ON public.layout_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_layout_photos_updated_at(); 