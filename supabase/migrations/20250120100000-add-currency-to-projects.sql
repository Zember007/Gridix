-- Добавляем поле валюты в таблицу проектов

-- Создаем enum для валют
CREATE TYPE public.currency_type AS ENUM ('RUB', 'USD', 'EUR', 'GEL');

-- Добавляем поле currency к таблице projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS currency public.currency_type DEFAULT 'USD';

-- Добавляем комментарий к полю
COMMENT ON COLUMN public.projects.currency IS 'Валюта для отображения цен в проекте';