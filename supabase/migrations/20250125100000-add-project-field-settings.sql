-- Создаем таблицу для настроек отображения полей проекта
CREATE TABLE project_field_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'select', 'boolean'
  is_custom BOOLEAN NOT NULL DEFAULT false, -- false для основных полей, true для кастомных
  is_visible BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(project_id, field_name)
);

-- Создаем индекс для быстрой сортировки
CREATE INDEX idx_project_field_settings_sort_order 
ON project_field_settings(project_id, sort_order);

-- Включаем RLS
ALTER TABLE project_field_settings ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS
CREATE POLICY "Users can view field settings for their projects" 
  ON project_field_settings 
  FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create field settings for their projects" 
  ON project_field_settings 
  FOR INSERT 
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update field settings for their projects" 
  ON project_field_settings 
  FOR UPDATE 
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete field settings for their projects" 
  ON project_field_settings 
  FOR DELETE 
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Создаем функцию для инициализации стандартных полей для проекта
CREATE OR REPLACE FUNCTION initialize_default_fields(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Вставляем стандартные поля, если их еще нет
  INSERT INTO project_field_settings (project_id, field_name, field_label, field_type, is_custom, is_visible, sort_order)
  VALUES 
    (p_project_id, 'number', 'Номер квартиры', 'text', false, true, 0),
    (p_project_id, 'floor', 'Этаж', 'number', false, true, 1),
    (p_project_id, 'rooms', 'Комнаты', 'number', false, true, 2),
    (p_project_id, 'area', 'Площадь (м²)', 'number', false, true, 3),
    (p_project_id, 'price', 'Цена', 'number', false, true, 4),
    (p_project_id, 'status', 'Статус', 'select', false, true, 5)
  ON CONFLICT (project_id, field_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Инициализируем стандартные поля для всех существующих проектов
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id FROM projects LOOP
    PERFORM initialize_default_fields(project_record.id);
  END LOOP;
END $$;