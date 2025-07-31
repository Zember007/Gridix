# 🚀 Подготовка к продакшену

## 1. Настройка базы данных Supabase

### Шаг 1: Применить миграции

1. Откройте **Supabase Dashboard** → ваш проект → **SQL Editor**
2. Выполните миграцию для layout_photos:

```sql
-- Создание таблицы для фотографий планировок
CREATE TABLE IF NOT EXISTS public.layout_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, layout_type, order_index)
);

ALTER TABLE public.layout_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for layout_photos" 
  ON public.layout_photos FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_layout_photos_project_id ON public.layout_photos(project_id);
CREATE INDEX IF NOT EXISTS idx_layout_photos_layout_type ON public.layout_photos(project_id, layout_type);
CREATE INDEX IF NOT EXISTS idx_layout_photos_order_index ON public.layout_photos(project_id, layout_type, order_index);
```

3. Выполните миграцию для пользователей и slug'ов:

```sql
-- Включаем расширение для генерации slug
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создаем таблицу пользователей
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Добавляем новые поля к проектам
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Функции для slug
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Zа-яё0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION ensure_unique_slug(base_slug TEXT, project_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  final_slug TEXT := base_slug;
  counter INTEGER := 1;
BEGIN
  WHILE EXISTS (
    SELECT 1 FROM public.projects 
    WHERE slug = final_slug 
    AND (project_id IS NULL OR id != project_id)
  ) LOOP
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.name), NEW.id);
  ELSE
    NEW.slug := ensure_unique_slug(NEW.slug, NEW.id);
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON public.projects;
CREATE TRIGGER trigger_auto_generate_slug
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION auto_generate_slug();

-- Генерируем slug для существующих проектов
UPDATE public.projects 
SET slug = ensure_unique_slug(generate_slug(name), id)
WHERE slug IS NULL;

-- Обновляем политики для projects
DROP POLICY IF EXISTS "Enable all operations for projects" ON public.projects;

CREATE POLICY "Users can view public projects" ON public.projects FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public);
CREATE INDEX IF NOT EXISTS idx_projects_is_featured ON public.projects(is_featured);

-- Функция для создания профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Таблица для аналитики просмотров
CREATE TABLE IF NOT EXISTS public.project_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON public.project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_created_at ON public.project_views(created_at);

ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert project views" ON public.project_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Project owners can view their project analytics" ON public.project_views FOR SELECT 
USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

-- RPC функция для увеличения счетчика просмотров
CREATE OR REPLACE FUNCTION increment_view_count(project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.projects 
  SET view_count = view_count + 1 
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql;
```

### Шаг 2: Настройка авторизации

1. Перейдите в **Authentication** → **Settings**
2. Включите **Enable email confirmations**
3. Настройте **Email templates** (опционально)
4. В **URL Configuration** добавьте:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs: `https://yourdomain.com/**`

### Шаг 3: Настройка Google OAuth (опционально)

1. Перейдите в **Authentication** → **Providers**
2. Включите **Google**
3. Добавьте Client ID и Client Secret из Google Console

### Шаг 4: Настройка Storage

1. Перейдите в **Storage**
2. Создайте bucket `project-images` (если не существует)
3. Настройте политики для bucket:

```sql
-- Создание bucket если не существует
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;

-- Новые политики для project-images bucket
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
```

## 2. Новые URL-схемы

### До миграции:
```
/ru/project/417cb2f2-2134-4fd5-849a-05af3ea37e03
/ru/admin/project/417cb2f2-2134-4fd5-849a-05af3ea37e03
```

### После миграции:
```
/ru/project/zhk-sovremennyy              # По slug
/ru/project/417cb2f2-2134-4fd5-849a-05af3ea37e03  # По UUID (для обратной совместимости)
/ru/admin/project/zhk-sovremennyy        # Только для владельца
```

## 3. Новые возможности

### ✅ Система пользователей
- Регистрация/авторизация через email
- Авторизация через Google
- Профили пользователей с компанией и контактами

### ✅ Приватность проектов
- `is_public: true` - проект виден всем
- `is_public: false` - проект виден только владельцу

### ✅ SEO-friendly URL
- Автоматическая генерация slug из названия проекта
- Поддержка кириллицы
- Проверка уникальности

### ✅ Аналитика
- Счетчик просмотров проектов
- Детальная аналитика в `project_views`
- IP, User-Agent, Referrer

### ✅ Фотографии планировок
- Загрузка фотографий для типов планировок
- Автоматическое отображение для квартир

## 4. Миграция существующих данных

### Для существующих проектов:
1. Все проекты станут публичными (`is_public = true`)
2. Владелец будет `NULL` - нужно вручную назначить владельцев
3. Автоматически сгенерируются slug'и

### Назначение владельцев (выполнить в SQL Editor):
```sql
-- Пример: назначить всех проектов пользователю
UPDATE public.projects 
SET user_id = 'USER_UUID_HERE'
WHERE user_id IS NULL;
```

## 5. Переменные окружения

Добавьте в `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 6. Развертывание

1. Соберите проект: `npm run build`
2. Настройте редиректы для SPA в вашем хостинге
3. Убедитесь, что домен добавлен в Supabase URL Configuration

## 🎉 Готово!

Теперь ваше приложение готово к продакшену с:
- ✅ Системой авторизации
- ✅ Приватными проектами  
- ✅ SEO-friendly URL
- ✅ Аналитикой просмотров
- ✅ Фотографиями планировок 