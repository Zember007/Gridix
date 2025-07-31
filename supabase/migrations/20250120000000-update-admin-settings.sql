-- Обновляем таблицу admin_settings для поддержки персональных настроек пользователей

-- Добавляем поле user_id
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Добавляем уникальный индекс для user_id (один пользователь - одни настройки)
CREATE UNIQUE INDEX IF NOT EXISTS admin_settings_user_id_idx ON public.admin_settings(user_id);

-- Включаем RLS для admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Удаляем старые политики если они есть
DROP POLICY IF EXISTS "Users can view own admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Users can update own admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Users can insert own admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Users can delete own admin settings" ON public.admin_settings;

-- Создаем новые политики RLS
CREATE POLICY "Users can view own admin settings" 
  ON public.admin_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own admin settings" 
  ON public.admin_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own admin settings" 
  ON public.admin_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own admin settings" 
  ON public.admin_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Обновляем существующие записи (если есть) - устанавливаем user_id для первой записи
-- Это временное решение, в реальности нужно будет определить правильного владельца
UPDATE public.admin_settings 
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Делаем user_id обязательным полем
ALTER TABLE public.admin_settings 
ALTER COLUMN user_id SET NOT NULL; 