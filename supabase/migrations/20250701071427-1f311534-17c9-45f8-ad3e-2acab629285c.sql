
-- Добавляем колонки для настроек кастомизации полигонов в таблицу projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS polygon_settings JSONB DEFAULT '{
  "colors": {
    "available": "#3b82f6",
    "sold": "#ef4444", 
    "reserved": "#f59e0b"
  },
  "hoverEffects": {
    "scale": false,
    "colorChange": true,
    "opacityChange": true,
    "glow": true
  },
  "display": {
    "showNumbers": true,
    "showTooltip": false,
    "showArea": false,
    "showPrice": false
  },
  "opacity": {
    "normal": 0.4,
    "hover": 0.7
  }
}'::jsonb;

-- Добавляем колонки для настроек кастомизации этажей здания в таблицу projects
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS building_polygon_settings JSONB DEFAULT '{
  "colors": {
    "available": "#3b82f6",
    "sold": "#ef4444",
    "reserved": "#f59e0b"
  },
  "hoverEffects": {
    "scale": false,
    "colorChange": true,
    "opacityChange": true,
    "glow": true
  },
  "display": {
    "showNumbers": true,
    "showTooltip": false,
    "showArea": false,
    "showPrice": false
  },
  "opacity": {
    "normal": 0.4,
    "hover": 0.7
  }
}'::jsonb;

-- Добавляем колонки для настроек кастомизации в таблицу floor_plans
ALTER TABLE public.floor_plans 
ADD COLUMN IF NOT EXISTS polygon_settings JSONB DEFAULT '{
  "colors": {
    "available": "#3b82f6",
    "sold": "#ef4444",
    "reserved": "#f59e0b"
  },
  "hoverEffects": {
    "scale": false,
    "colorChange": true,
    "opacityChange": true,
    "glow": true
  },
  "display": {
    "showNumbers": true,
    "showTooltip": false,
    "showArea": false,
    "showPrice": false
  },
  "opacity": {
    "normal": 0.4,
    "hover": 0.7
  }
}'::jsonb;
