-- Добавляем поле для переводов названий кастомных полей
-- Структура: {"ru": "Название на русском", "en": "Name in English", "ka": "სახელი ქართულად"}
ALTER TABLE project_custom_fields 
ADD COLUMN field_label_translations JSONB DEFAULT '{}'::jsonb;

-- Добавляем индекс для улучшения производительности запросов по переводам
CREATE INDEX idx_project_custom_fields_translations 
ON project_custom_fields USING GIN (field_label_translations);

-- Добавляем комментарий для документации
COMMENT ON COLUMN project_custom_fields.field_label_translations IS 
'JSON object containing field label translations for supported languages (ru, en, ka)';
