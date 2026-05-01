import type { Tables } from "@gridix/types/database";

/** Hard cap on sub-projects (buildings/objects) per project — must match `project-editor` if enforced server-side. */
export const MAX_SUB_PROJECTS_PER_PROJECT = 50;

export type SubProject = Tables<"sub_projects">;
export type Masterplan = Tables<"project_masterplans">;
export type MasterplanArea = Tables<"project_masterplan_areas">;
export type InfrastructureZone = Tables<"project_infrastructure_zones">;

export interface SubProjectWithCount extends SubProject {
  apartment_count?: number;
}

export interface MasterplanAreaEnriched extends MasterplanArea {
  building_summary?: {
    available_count: number;
    price_from: number | null;
    currency: string | null;
  } | null;
  infrastructure_zone?: InfrastructureZone | null;
}

export interface MasterplanEditorData {
  masterplans: Array<
    Masterplan & { project_masterplan_areas: MasterplanArea[] }
  >;
  infrastructureZones: InfrastructureZone[];
  facades: Array<{ id: string; name: string; order_index: number }>;
}
