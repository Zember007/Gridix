// Shared entity types across applications
// These will be migrated from src/entities/ in apps/main

import type { Json } from "./database";

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface Apartment {
  id: string;
  apartment_number: string;
  floor_number: number;
  rooms: number | string;
  area: number;
  price: number | null;
  status: "available" | "sold" | "reserved";
  type: "apartment" | "commercial" | "parking";
  polygon: { x: number; y: number }[];
  custom_fields: Json | null;
  project_id: string;
  created_at: string;
  updated_at: string;
  floor_plan_id: string | null;
}

// Add more entity types as needed during migration
