-- Создаем триггерную функцию для автоматической инициализации полей при создании проекта
CREATE OR REPLACE FUNCTION trigger_initialize_default_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Вызываем функцию инициализации полей для нового проекта
  PERFORM initialize_default_fields(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер на вставку в таблицу projects
DROP TRIGGER IF EXISTS auto_initialize_project_fields ON projects;
CREATE TRIGGER auto_initialize_project_fields
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_initialize_default_fields();

-- Комментарий для объяснения
COMMENT ON TRIGGER auto_initialize_project_fields ON projects IS 
'Автоматически инициализирует стандартные поля для отображения квартир при создании нового проекта';
