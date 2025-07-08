
import type { Json } from '@/integrations/supabase/types';

export interface Apartment {
  id: string;
  apartment_number: string;
  floor_number: number;
  rooms: number;
  area: number;
  price: number | null;
  status: 'available' | 'sold' | 'reserved';
  polygon: { x: number; y: number }[];
  custom_fields: Json | null;
}
