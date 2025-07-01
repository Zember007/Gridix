
-- Создаем таблицу для настроек синхронизации проектов
CREATE TABLE IF NOT EXISTS public.project_sync_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  excel_url TEXT NOT NULL,
  sync_interval INTEGER NOT NULL DEFAULT 300, -- в секундах
  column_mapping JSONB NOT NULL DEFAULT '{}', -- маппинг столбцов Excel
  is_active BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'paused')),
  last_sync TIMESTAMP WITH TIME ZONE,
  next_sync TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id) -- Один проект может иметь только одну настройку синхронизации
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_project_sync_settings_project_id ON public.project_sync_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_project_sync_settings_next_sync ON public.project_sync_settings(next_sync);
CREATE INDEX IF NOT EXISTS idx_project_sync_settings_active ON public.project_sync_settings(is_active, status);

-- Функция для автоматического обновления next_sync при изменении sync_interval
CREATE OR REPLACE FUNCTION update_next_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Если изменился интервал синхронизации, пересчитываем next_sync
  IF NEW.sync_interval != OLD.sync_interval OR NEW.is_active != OLD.is_active THEN
    IF NEW.is_active = true THEN
      NEW.next_sync = now() + (NEW.sync_interval || ' seconds')::INTERVAL;
    ELSE
      NEW.next_sync = NULL;
    END IF;
  END IF;
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления
CREATE TRIGGER trigger_update_next_sync
  BEFORE UPDATE ON public.project_sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_next_sync();

-- Функция для установки next_sync при создании записи
CREATE OR REPLACE FUNCTION set_initial_next_sync()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    NEW.next_sync = now() + (NEW.sync_interval || ' seconds')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для установки next_sync при создании
CREATE TRIGGER trigger_set_initial_next_sync
  BEFORE INSERT ON public.project_sync_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_initial_next_sync();

-- Создаем таблицу для логов синхронизации
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sync_settings_id UUID NOT NULL REFERENCES public.project_sync_settings(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  records_processed INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_added INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Индекс для логов синхронизации
CREATE INDEX IF NOT EXISTS idx_sync_logs_project_id ON public.sync_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at);
