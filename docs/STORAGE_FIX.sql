-- Исправление политик Storage и RLS для загрузки фотографий
-- Выполните этот скрипт в Supabase Dashboard → SQL Editor

-- ========================================
-- 1. ИСПРАВЛЕНИЕ STORAGE ПОЛИТИК
-- ========================================

-- Создание bucket если не существует
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Удаление старых политик если они есть
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update project images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete project images" ON storage.objects;

-- Создание новых политик для project-images bucket

-- Просмотр изображений - доступно всем
CREATE POLICY "Anyone can view project images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'project-images');

-- Загрузка изображений - доступно аутентифицированным пользователям
CREATE POLICY "Authenticated users can upload project images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- Обновление изображений - доступно аутентифицированным пользователям
CREATE POLICY "Authenticated users can update project images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- Удаление изображений - доступно аутентифицированным пользователям
CREATE POLICY "Authenticated users can delete project images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'project-images' AND auth.role() = 'authenticated');

-- ========================================
-- 2. ИСПРАВЛЕНИЕ RLS ПОЛИТИК ДЛЯ ТАБЛИЦ
-- ========================================

-- Исправление политик для layout_photos
DROP POLICY IF EXISTS "Enable all operations for layout_photos" ON public.layout_photos;
DROP POLICY IF EXISTS "Allow authenticated users to manage layout photos" ON public.layout_photos;

-- Новые политики для layout_photos
CREATE POLICY "Allow authenticated users to view layout photos" 
ON public.layout_photos FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert layout photos" 
ON public.layout_photos FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update layout photos" 
ON public.layout_photos FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete layout photos" 
ON public.layout_photos FOR DELETE 
USING (auth.role() = 'authenticated');

-- Исправление политик для apartment_photos
DROP POLICY IF EXISTS "Enable all operations for apartment_photos" ON public.apartment_photos;
DROP POLICY IF EXISTS "Allow authenticated users to manage apartment photos" ON public.apartment_photos;

-- Новые политики для apartment_photos
CREATE POLICY "Allow authenticated users to view apartment photos" 
ON public.apartment_photos FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert apartment photos" 
ON public.apartment_photos FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update apartment photos" 
ON public.apartment_photos FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete apartment photos" 
ON public.apartment_photos FOR DELETE 
USING (auth.role() = 'authenticated');

-- ========================================
-- 3. ПРОВЕРКА РЕЗУЛЬТАТОВ
-- ========================================

-- Проверка Storage политик
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage'
AND policyname LIKE '%project images%';

-- Проверка RLS политик для layout_photos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'layout_photos' 
AND schemaname = 'public';

-- Проверка RLS политик для apartment_photos
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'apartment_photos' 
AND schemaname = 'public';

-- Проверка bucket
SELECT * FROM storage.buckets WHERE id = 'project-images';

-- Проверка что таблицы существуют
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('layout_photos', 'apartment_photos') 
AND table_schema = 'public'; 