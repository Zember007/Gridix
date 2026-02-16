/** Shared types for the project-selector feature. */

export type ViewMode =
  | "facade"
  | "floor-plan"
  | "list"
  | "map"
  | "favorites"
  | "chess";

export interface ProjectFacade {
  id: string;
  project_id: string;
  name: string;
  image_url: string | null;
  order_index: number;
}

export interface LayoutPhoto {
  id: string;
  image_url: string;
  description?: string;
  order_index: number;
  type: "layout";
}

export interface FieldVisibility {
  rooms: boolean;
  floor: boolean;
  price: boolean;
  area: boolean;
  number: boolean;
  status: boolean;
  tooltip: boolean;
}
