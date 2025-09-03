
import type { Json } from '@/integrations/supabase/types';

export interface Apartment {
  id: string;
  apartment_number: string;
  floor_number: number;
  rooms: number | string;
  area: number;
  price: number | null;
  status: 'available' | 'sold' | 'reserved';
  type: 'apartment' | 'commercial' | 'parking';
  polygon: { x: number; y: number }[];
  custom_fields: Json | null;
  project_id: string;
  created_at: string;
  updated_at: string;
  floor_plan_id: string | null;
}

// Функция для преобразования данных из Supabase в правильный формат
export function normalizeApartmentData(data: any): Apartment {
  return {
    ...data,
    status: data.status as 'available' | 'sold' | 'reserved',
    type: data.type as 'apartment' | 'commercial' | 'parking' || 'apartment',
    polygon: Array.isArray(data.polygon) ? data.polygon as { x: number; y: number }[] : [],
    price: data.price ? Number(data.price) : null,
    area: Number(data.area),
    rooms: Number(data.rooms),
    floor_number: Number(data.floor_number)
  };
}
