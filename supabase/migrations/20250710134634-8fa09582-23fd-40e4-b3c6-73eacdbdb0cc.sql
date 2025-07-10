
-- Создание таблицы для настроек администратора
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT,
  company_description TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  contact_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Создание таблицы для фотографий квартир
CREATE TABLE IF NOT EXISTS public.apartment_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  apartment_id UUID NOT NULL REFERENCES public.apartments(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включение RLS для таблиц
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apartment_photos ENABLE ROW LEVEL SECURITY;

-- Политики для admin_settings
CREATE POLICY "Enable all operations for admin_settings" 
  ON public.admin_settings 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Политики для apartment_photos
CREATE POLICY "Enable all operations for apartment_photos" 
  ON public.apartment_photos 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_apartment_photos_apartment_id ON public.apartment_photos(apartment_id);
CREATE INDEX IF NOT EXISTS idx_apartment_photos_order_index ON public.apartment_photos(apartment_id, order_index);

-- Вставка начальной записи для настроек (если её нет)
INSERT INTO public.admin_settings (company_name, company_description, contact_name, contact_phone, contact_email, contact_address)
SELECT '', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM public.admin_settings);
