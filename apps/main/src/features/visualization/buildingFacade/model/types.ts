import type { ReactNode } from "react";
import type { Apartment } from "@/entities/apartment/model/types";
import type { FieldSetting } from "@/hooks/useFields";

export type BuildingFacadeProject = {
  id: string;
  name: string;
  building_image_url: string | null;
  currency?: string | null;
  facade_open?: boolean | null;
};

export interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

export interface FacadeNavItem {
  id: string;
  name: string;
}

export interface FacadeSettings {
  colors: {
    building: string;
    available?: string;
    sold?: string;
    reserved?: string;
  };
  opacity: { normal: number; hover: number };
  hoverEffects: {
    glow: boolean;
    colorChange?: boolean;
    opacityChange?: boolean;
    scale?: boolean;
  };
  display: {
    showNumbers: boolean;
    showTooltip: boolean;
    showArea?: boolean;
    showPrice?: boolean;
  };
}

export type MasterplanPolygonItem = {
  id: string;
  polygon: { x: number; y: number }[];
};

export interface PolygonPlanImageViewProps {
  projectId: string;
  themeColor: string;
  project: BuildingFacadeProject;
  /** Building vs villa layout — from `sub_projects.type` in scope (not `projects.project_type`). */
  entityKind: "building" | "object";
  imageUrl?: string | null;
  apartments: Apartment[];
  onFloorSelect?: (floor: number) => void;
  onApartmentSelect: (apartment: Apartment) => void;
  filtersRef?: React.RefObject<HTMLDivElement>;
  externalImageLoaded?: boolean;
  externalImageNaturalSize?: { width: number; height: number };
  showOnlyAvailable?: boolean;
  visibleFields: FieldSetting[];
  buildingFloors: BuildingFloor[];
  facadeSettings: FacadeSettings | null;
  loading: boolean;
  selectedCurrency?: string;
  facades?: FacadeNavItem[];
  activeFacadeIndex?: number;
  onFacadeChange?: (nextIndex: number) => void;
  /** Facade (default) or masterplan / genplan polygons in the same viewer shell. */
  planKind?: "facade" | "masterplan";
  /** Polygons in **percent** coordinates 0–100 (same as facade floors). */
  masterplanPolygons?: MasterplanPolygonItem[];
  onMasterplanAreaClick?: (areaId: string) => void;
  /** Tooltip/popup body when `facadeSettings.display.showTooltip` and hovering a masterplan polygon. */
  masterplanRenderTooltip?: (areaId: string) => ReactNode;
  /** Short labels on masterplan polygons (when `planKind === "masterplan"` and `display.showNumbers`). */
  masterplanPolygonLabels?: Record<string, string>;
}

/** @deprecated Use PolygonPlanImageViewProps */
export type BuildingFacadeViewProps = PolygonPlanImageViewProps;
