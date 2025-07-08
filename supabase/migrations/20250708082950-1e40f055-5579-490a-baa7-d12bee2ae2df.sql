
-- Добавляем колонку для хранения кастомных полей в таблицу квартир
ALTER TABLE apartments ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;

-- Добавляем таблицу для хранения определений кастомных полей проекта
CREATE TABLE project_custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT false,
  field_options JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(project_id, field_name)
);

-- Включаем RLS для таблицы кастомных полей
ALTER TABLE project_custom_fields ENABLE ROW LEVEL SECURITY;

-- Создаем политики RLS для кастомных полей
CREATE POLICY "Users can view custom fields for their projects" 
  ON project_custom_fields 
  FOR SELECT 
  USING (project_id IN (SELECT id FROM projects WHERE id = project_custom_fields.project_id));

CREATE POLICY "Users can create custom fields for their projects" 
  ON project_custom_fields 
  FOR INSERT 
  WITH CHECK (project_id IN (SELECT id FROM projects WHERE id = project_custom_fields.project_id));

CREATE POLICY "Users can update custom fields for their projects" 
  ON project_custom_fields 
  FOR UPDATE 
  USING (project_id IN (SELECT id FROM projects WHERE id = project_custom_fields.project_id));

CREATE POLICY "Users can delete custom fields for their projects" 
  ON project_custom_fields 
  FOR DELETE 
  USING (project_id IN (SELECT id FROM projects WHERE id = project_custom_fields.project_id));
