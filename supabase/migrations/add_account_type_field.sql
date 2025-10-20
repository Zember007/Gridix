-- Миграция для добавления поля account_type в user_profiles
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Добавляем поле account_type в таблицу user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN account_type text DEFAULT 'developer' NOT NULL;

-- 2. Добавляем индекс для быстрых запросов
CREATE INDEX idx_user_profiles_account_type ON public.user_profiles(account_type);

-- 3. Добавляем ограничение для валидных значений
ALTER TABLE public.user_profiles 
ADD CONSTRAINT check_account_type 
CHECK (account_type IN ('developer', 'manager'));

-- 4. Обновляем существующих пользователей
-- Если пользователь является менеджером (есть записи в manager_accounts), устанавливаем account_type = 'manager'
UPDATE public.user_profiles 
SET account_type = 'manager'
WHERE id IN (
  SELECT DISTINCT manager_id 
  FROM public.manager_accounts 
  WHERE status = 'active'
);

-- 5. Проверяем результат
SELECT 
  account_type,
  COUNT(*) as user_count
FROM public.user_profiles 
GROUP BY account_type;
