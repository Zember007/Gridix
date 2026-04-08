import { supabase } from "@gridix/utils/api";
import type { Tables } from "@gridix/types/database";
import type {
  LayoutPhoto,
  ProjectFacade,
} from "@/components/project-selector/types";
import type { FacadeSettings } from "@/features/visualization/buildingFacade/model/types";

const FUNCTION_NAME = "project-selector";

// ── Result types ──

export interface SelectorSummaryResult {
  project: Tables<"projects">;
  fieldSettings: Tables<"project_field_settings">[];
  customFields: Tables<"project_custom_fields">[];
  customDomain: string | null;
}

export interface SubProjectListItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  sort_order: number;
  is_default: boolean;
  building_image_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  available_count: number;
  min_price: number | null;
}

/** Ensures new list fields exist when talking to an older project-selector deployment. */
function normalizeSubProjectListItem(sp: {
  id: string;
  name: string;
  slug: string;
  type: string;
  sort_order: number;
  is_default: boolean;
  building_image_url: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  available_count?: number;
  min_price?: number | null;
}): SubProjectListItem {
  return {
    id: sp.id,
    name: sp.name,
    slug: sp.slug,
    type: sp.type,
    sort_order: sp.sort_order,
    is_default: sp.is_default,
    building_image_url: sp.building_image_url,
    address: sp.address ?? null,
    latitude: sp.latitude ?? null,
    longitude: sp.longitude ?? null,
    available_count: sp.available_count ?? 0,
    min_price: sp.min_price ?? null,
  };
}

export interface MasterplanListItem {
  id: string;
  name: string;
  background_asset_url: string | null;
  is_default: boolean;
}

export interface SelectorInitialResult {
  project: Tables<"projects">;
  apartments: Array<Record<string, unknown>>;
  layoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  fieldSettings: Tables<"project_field_settings">[];
  customFields: Tables<"project_custom_fields">[];
  customDomain: string | null;
  subProjects: SubProjectListItem[];
  masterplansList: MasterplanListItem[];
}

export interface SelectorFacadeResult {
  facades: ProjectFacade[];
  floorsByFacadeId: Record<
    string,
    Array<{
      id: string;
      floor_number: number;
      polygon: Array<{ x: number; y: number }>;
      color: string | null;
    }>
  >;
  facadeSettings: FacadeSettings;
}

export interface SelectorFloorPolygonsResult {
  polygonsByFloor: Record<number, Array<{ id: string; polygon: unknown }>>;
}

export interface SelectorFloorPlanResult {
  floorPlan: { id: string; image_url: string | null } | null;
  floorSettings: {
    colors?: { available: string; reserved: string; sold: string };
    opacity?: { normal: number; hover: number };
    display?: {
      showNumbers?: boolean;
      showTooltip?: boolean;
      showArea?: boolean;
      showPrice?: boolean;
    };
    hoverEffects?: {
      glow?: boolean;
      colorChange?: boolean;
      opacityChange?: boolean;
      scale?: boolean;
    };
  };
}

// ── Helpers ──

function unwrap<T>(data: T | null | undefined, error: unknown): T {
  if (error) throw error;
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    (data as Record<string, unknown>).error
  ) {
    throw new Error((data as Record<string, unknown>).error as string);
  }
  return data as T;
}

// ── API functions ──

export async function loadSelectorSummary(
  projectId: string,
): Promise<SelectorSummaryResult> {
  try {
    const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
      body: { action: "load-summary", projectId },
    });
    const result = unwrap(data, error);
    if (!result.project) throw new Error("Project not found");

    return {
      project: result.project,
      fieldSettings: result.fieldSettings ?? [],
      customFields: result.customFields ?? [],
      customDomain: result.customDomain ?? null,
    };
  } catch {
    // Backward compatibility: if the function doesn't support summary yet,
    // fall back to the existing "load-initial" action.
    const full = await loadSelectorInitial(projectId);
    return {
      project: full.project,
      fieldSettings: full.fieldSettings,
      customFields: full.customFields,
      customDomain: full.customDomain,
    };
  }
}

export interface SelectorSubProjectResult extends SelectorInitialResult {
  subProjectId: string | null;
  subProject: Tables<"sub_projects"> | null;
}

export async function loadSelectorSubProject(
  projectId: string,
  subProjectSlug: string,
): Promise<SelectorSubProjectResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-sub-project",
      projectSlug: projectId,
      subProjectSlug,
    },
  });

  const result = unwrap(data, error);
  if (!result.project) throw new Error("Sub-project not found");

  return {
    project: result.project,
    apartments: result.apartments ?? [],
    layoutPhotosByRooms: result.layoutPhotosByRooms ?? {},
    fieldSettings: result.fieldSettings ?? [],
    customFields: result.customFields ?? [],
    customDomain: result.customDomain ?? null,
    subProjectId:
      (result.subProjectId as string | undefined) ??
      result.subProject?.id ??
      null,
    subProject: result.subProject ?? null,
    subProjects: [],
    masterplansList: [],
  };
}

export async function loadSelectorInitial(
  projectId: string,
): Promise<SelectorInitialResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action: "load-initial", projectId },
  });

  const result = unwrap(data, error);
  if (!result.project) throw new Error("Project not found");

  return {
    project: result.project,
    apartments: result.apartments ?? [],
    layoutPhotosByRooms: result.layoutPhotosByRooms ?? {},
    fieldSettings: result.fieldSettings ?? [],
    customFields: result.customFields ?? [],
    customDomain: result.customDomain ?? null,
    subProjects: (result.subProjects ?? []).map(normalizeSubProjectListItem),
    masterplansList: result.masterplansList ?? [],
  };
}

export async function loadSelectorFacade(
  projectId: string,
  subProjectId?: string,
): Promise<SelectorFacadeResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-facade",
      projectId,
      ...(subProjectId && { subProjectId }),
    },
  });

  const result = unwrap(data, error);

  return {
    facades: result.facades ?? [],
    floorsByFacadeId: result.floorsByFacadeId ?? {},
    facadeSettings: result.facadeSettings ?? null,
  };
}

export async function loadSelectorFloorPolygons(
  projectId: string,
  floors: number[],
  subProjectId?: string,
): Promise<SelectorFloorPolygonsResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-floor-polygons",
      projectId,
      floors,
      ...(subProjectId && { subProjectId }),
    },
  });

  const result = unwrap(data, error);

  return {
    polygonsByFloor: result.polygonsByFloor ?? {},
  };
}

export async function loadSelectorFloorPlan(
  projectId: string,
  floorNumber: number,
  subProjectId?: string,
): Promise<SelectorFloorPlanResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-floor-plan",
      projectId,
      floorNumber,
      ...(subProjectId && { subProjectId }),
    },
  });

  const result = unwrap(data, error);

  return {
    floorPlan: result.floorPlan ?? null,
    floorSettings: result.floorSettings ?? {},
  };
}

export async function loadSelectorApartmentPhotos(
  apartmentIds: string[],
): Promise<Record<string, string | null>> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action: "load-apartment-photos", apartmentIds },
  });

  const result = unwrap(data, error);

  return result.coverByApartmentId ?? {};
}

// ── Floors-light ──

export interface SelectorFloorsLightResult {
  floors: { id: string; floor_number: number }[];
}

export async function loadSelectorFloorsLight(
  projectId: string,
  subProjectId?: string,
): Promise<SelectorFloorsLightResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-floors-light",
      projectId,
      ...(subProjectId && { subProjectId }),
    },
  });

  const result = unwrap(data, error);

  return { floors: result.floors ?? [] };
}

// ── Apartment media ──

export interface ApartmentMediaResult {
  apartmentPhotos: {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
  }[];
  layoutPhotos: {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
  }[];
}

export async function loadApartmentMedia(
  projectId: string,
  apartmentId: string,
  layoutType: string,
): Promise<ApartmentMediaResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-apartment-media",
      projectId,
      apartmentId,
      layoutType,
    },
  });

  const result = unwrap(data, error);

  return {
    apartmentPhotos: result.apartmentPhotos ?? [],
    layoutPhotos: result.layoutPhotos ?? [],
  };
}

// ── Recommended apartments ──

export interface RecommendedApartmentsResult {
  recommended: Array<Record<string, unknown>>;
  thumbnails: Record<string, string | null>;
}

export async function loadRecommendedApartments(
  projectId: string,
  apartmentId: string,
  rooms: string | number,
  limit = 4,
): Promise<RecommendedApartmentsResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-recommended-apartments",
      projectId,
      apartmentId,
      rooms,
      limit,
    },
  });

  const result = unwrap(data, error);

  return {
    recommended: result.recommended ?? [],
    thumbnails: result.thumbnails ?? {},
  };
}

// ── Apartment details (single call for the whole page) ──

export interface ApartmentDetailsResult {
  project: Tables<"projects"> | null;
  apartment: Record<string, unknown> | null;
  /** Resolved `sub_projects.type` for this apartment's scope (not `projects.project_type`). */
  subProjectType: string | null;
  fieldSettings: Tables<"project_field_settings">[];
  customFields: Tables<"project_custom_fields">[];
  apartmentPhotos: {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
  }[];
  layoutPhotos: {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
  }[];
  recommended: Array<Record<string, unknown>>;
  thumbnails: Record<string, string | null>;
}

export interface PdfTemplateDataResult {
  project: Tables<"projects"> | null;
  apartment: Record<string, unknown> | null;
  subProjectType: string | null;
  fieldSettings: Tables<"project_field_settings">[];
  apartmentPhotos: {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
  }[];
  layoutPhotos: {
    id: string;
    image_url: string;
    description?: string | null;
    order_index: number;
  }[];
  floorPlan: { image_url: string | null } | null;
  projectDomains: { domain: string; is_primary: boolean }[];
  companyName: string | null;
  companyLogoUrl: string | null;
}

export async function loadApartmentDetails(
  projectId: string,
  apartmentIdentifier: string,
  useId = false,
  subProjectSlug?: string,
): Promise<ApartmentDetailsResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-apartment-details",
      projectId,
      apartmentIdentifier,
      useId,
      ...(subProjectSlug ? { subProjectSlug } : {}),
    },
  });

  const result = unwrap(data, error);

  return {
    project: result.project ?? null,
    apartment: result.apartment ?? null,
    subProjectType: (result.subProjectType as string | null) ?? null,
    fieldSettings: result.fieldSettings ?? [],
    customFields: result.customFields ?? [],
    apartmentPhotos: result.apartmentPhotos ?? [],
    layoutPhotos: result.layoutPhotos ?? [],
    recommended: result.recommended ?? [],
    thumbnails: result.thumbnails ?? {},
  };
}

export async function loadPdfTemplateData(
  projectId: string,
  apartmentIdentifier: string,
  useId = false,
  subProjectSlug?: string,
): Promise<PdfTemplateDataResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-pdf-template",
      projectId,
      apartmentIdentifier,
      useId,
      ...(subProjectSlug ? { subProjectSlug } : {}),
    },
  });

  const result = unwrap(data, error);

  return {
    project: result.project ?? null,
    apartment: result.apartment ?? null,
    subProjectType: (result.subProjectType as string | null) ?? null,
    fieldSettings: result.fieldSettings ?? [],
    apartmentPhotos: result.apartmentPhotos ?? [],
    layoutPhotos: result.layoutPhotos ?? [],
    floorPlan: result.floorPlan ?? null,
    projectDomains: result.projectDomains ?? [],
    companyName: result.companyName ?? null,
    companyLogoUrl: result.companyLogoUrl ?? null,
  };
}

// ── Masterplan data (public viewer) ──

/** Public masterplan preview — subset of `project_infrastructure_zones` used by the genplan viewer. */
export interface MasterplanInfrastructureZone {
  id: string;
  name: string | null;
  short_description: string | null;
  full_description: string | null;
  cover_image: string | null;
  zone_type?: string | null;
}

export interface MasterplanArea {
  id: string;
  area_type: string;
  geometry: unknown;
  geometry_type: string;
  label: string | null;
  short_label: string | null;
  linked_entity_type: string;
  linked_entity_id: string | null;
  is_clickable: boolean;
  sort_order: number;
  z_index: number;
  status: string;
  ui_payload: unknown;
  open_behavior: string | null;
  building_summary?: {
    available_count: number;
    price_from: number | null;
    currency: string | null;
  } | null;
  infrastructure_zone?: MasterplanInfrastructureZone | null;
}

export interface SelectorMasterplanResult {
  masterplan: {
    id: string;
    name: string;
    background_asset_url: string | null;
    background_asset_width: number | null;
    background_asset_height: number | null;
    polygon_display_settings: unknown;
    viewport_default: unknown;
  } | null;
  areas: MasterplanArea[];
  infrastructureZones: MasterplanInfrastructureZone[];
}

export async function loadSelectorMasterplan(
  projectId: string,
  masterplanId?: string,
): Promise<SelectorMasterplanResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "load-masterplan-preview",
      projectId,
      ...(masterplanId && { masterplanId }),
    },
  });

  const result = unwrap(data, error);

  return {
    masterplan: result.masterplan ?? null,
    areas: result.areas ?? [],
    infrastructureZones: (result.infrastructureZones ??
      []) as MasterplanInfrastructureZone[],
  };
}

// ── Excel apartment sync ──

export interface ApartmentSyncUpdate {
  apartment_number: string;
  floor_number?: number;
  rooms?: string | number;
  area?: number;
  price?: number | null;
  status?: "available" | "sold" | "reserved";
  custom_fields?: Record<string, unknown>;
}

export interface SyncApartmentsResult {
  updatedCount: number;
  notFound: string[];
  total: number;
}

export async function syncApartmentsFromExcel(
  projectId: string,
  updates: ApartmentSyncUpdate[],
): Promise<SyncApartmentsResult> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: {
      action: "sync-apartments-from-excel",
      projectId,
      updates,
    },
  });

  const result = unwrap(data, error);

  return {
    updatedCount: result.updatedCount ?? 0,
    notFound: result.notFound ?? [],
    total: result.total ?? 0,
  };
}
