-- Создаем функцию для получения проектов с минимальными ценами квартир
-- Эта функция оптимизирует запросы, избегая множественных запросов для каждого проекта

CREATE OR REPLACE FUNCTION get_projects_with_min_prices(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  address text,
  building_image_url text,
  latitude double precision,
  longitude double precision,
  currency text,
  min_price numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.address,
    p.building_image_url,
    p.latitude,
    p.longitude,
    p.currency,
    min_prices.min_price
  FROM projects p
  LEFT JOIN (
    SELECT 
      a.project_id,
      MIN(a.price) as min_price
    FROM apartments a
    WHERE a.price IS NOT NULL
    GROUP BY a.project_id
  ) min_prices ON p.id = min_prices.project_id
  WHERE p.user_id = user_id_param 
    AND p.is_public = true
  ORDER BY p.created_at DESC;
$$;

-- Добавляем комментарий к функции
COMMENT ON FUNCTION get_projects_with_min_prices(uuid) IS 
'Оптимизированная функция для получения проектов пользователя с минимальными ценами квартир. Использует LEFT JOIN для эффективного получения данных одним запросом.';