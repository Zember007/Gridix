
-- Создаем тестовый проект
INSERT INTO public.projects (id, name, description, floors, building_image_url) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'ЖК "Современный"',
  'Современный жилой комплекс в центре города',
  5,
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop'
);

-- Создаем этажи здания с полигонами
INSERT INTO public.building_floors (id, project_id, floor_number, polygon, color) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, '[{"x": 20, "y": 20}, {"x": 80, "y": 20}, {"x": 80, "y": 40}, {"x": 20, "y": 40}]', '#3b82f6'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, '[{"x": 20, "y": 42}, {"x": 80, "y": 42}, {"x": 80, "y": 62}, {"x": 20, "y": 62}]', '#10b981'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, '[{"x": 20, "y": 64}, {"x": 80, "y": 64}, {"x": 80, "y": 84}, {"x": 20, "y": 84}]', '#f59e0b');

-- Создаем планы этажей
INSERT INTO public.floor_plans (id, project_id, floor_number, image_url) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop');

-- Создаем квартиры на первом этаже
INSERT INTO public.apartments (id, project_id, floor_number, apartment_number, rooms, area, price, status, polygon) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, '1', 1, 35.5, 3500000, 'available', '[{"x": 10, "y": 10}, {"x": 30, "y": 10}, {"x": 30, "y": 25}, {"x": 10, "y": 25}]'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, '2', 2, 52.3, 5200000, 'available', '[{"x": 32, "y": 10}, {"x": 55, "y": 10}, {"x": 55, "y": 25}, {"x": 32, "y": 25}]'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 1, '3', 3, 78.1, 7800000, 'sold', '[{"x": 57, "y": 10}, {"x": 85, "y": 10}, {"x": 85, "y": 25}, {"x": 57, "y": 25}]');

-- Создаем квартиры на втором этаже
INSERT INTO public.apartments (id, project_id, floor_number, apartment_number, rooms, area, price, status, polygon) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, '4', 1, 36.2, 3600000, 'reserved', '[{"x": 10, "y": 35}, {"x": 30, "y": 35}, {"x": 30, "y": 50}, {"x": 10, "y": 50}]'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, '5', 2, 53.1, 5300000, 'available', '[{"x": 32, "y": 35}, {"x": 55, "y": 35}, {"x": 55, "y": 50}, {"x": 32, "y": 50}]'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 2, '6', 3, 79.5, 7950000, 'available', '[{"x": 57, "y": 35}, {"x": 85, "y": 35}, {"x": 85, "y": 50}, {"x": 57, "y": 50}]');

-- Создаем квартиры на третьем этаже
INSERT INTO public.apartments (id, project_id, floor_number, apartment_number, rooms, area, price, status, polygon) VALUES
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, '7', 1, 35.8, 3580000, 'available', '[{"x": 10, "y": 60}, {"x": 30, "y": 60}, {"x": 30, "y": 75}, {"x": 10, "y": 75}]'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, '8', 2, 52.9, 5290000, 'sold', '[{"x": 32, "y": 60}, {"x": 55, "y": 60}, {"x": 55, "y": 75}, {"x": 32, "y": 75}]'),
  (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 3, '9', 3, 78.7, 7870000, 'available', '[{"x": 57, "y": 60}, {"x": 85, "y": 60}, {"x": 85, "y": 75}, {"x": 57, "y": 75}]');
