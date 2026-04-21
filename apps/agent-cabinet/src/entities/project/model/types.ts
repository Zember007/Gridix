import type { SharedProject } from "@gridix/ui";

export type Project = {
  id: string;
  name: string;
  currency?: string | null;
  slug: string | null;
  address: string | null;
  building_image_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  floors?: number | null;
  total_units?: number | null;
  available_units?: number | null;
  min_price?: number | null;
  yield_percent?: number | null;
  commission_percent?: number | null;
  commission_condition?: string | null;
  developer_name?: string | null;
  allow_partner_connect?: boolean | null;
};

export type UnitStatusGroup = "available" | "booked" | "sold";

export interface ProjectUnit {
  id: string;
  apartment_number: string | null;
  floor_number: number;
  status: string | null;
  price?: number | null;
}

export interface ProjectDrawerResponse {
  success?: boolean;
  error?: string;
  project?: {
    id: string;
    currency?: string | null;
    name?: string;
    slug?: string;
    location?: string;
    imageUrl?: string;
    description?: string;
    floors?: number | string;
    minPrice?: number;
    yield?: number;
    stats?: SharedProject["stats"];
    media?: SharedProject["media"];
    constructionProgress?: SharedProject["constructionProgress"];
    partnershipSettings?: SharedProject["partnershipSettings"];
  };
}
