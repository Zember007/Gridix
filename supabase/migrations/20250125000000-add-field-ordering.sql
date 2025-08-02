-- Добавляем поля для управления порядком и видимостью кастомных полей
ALTER TABLE project_custom_fields 
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0,
ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;

-- Устанавливаем начальный порядок сортировки для существующих полей
UPDATE project_custom_fields 
SET sort_order = (
  SELECT ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at) - 1
  FROM project_custom_fields pf2 
  WHERE pf2.id = project_custom_fields.id
);

-- Создаем индекс для быстрой сортировки
CREATE INDEX idx_project_custom_fields_sort_order 
ON project_custom_fields(project_id, sort_order);