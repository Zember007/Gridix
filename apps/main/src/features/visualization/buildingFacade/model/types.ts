import type { Apartment } from "@/entities/apartment/model/types";
import type { FieldSetting } from "@/hooks/useFields";

export type BuildingFacadeProject = {
  id: string;
  name: string;
  building_image_url: string | null;
  project_type?: "building" | "object" | null;
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
  colors: { building: string };
  opacity: { normal: number; hover: number };
  hoverEffects: {
    glow: boolean;
    colorChange?: boolean;
    opacityChange?: boolean;
    scale?: boolean;
  };
  display: { showNumbers: boolean; showTooltip: boolean };
}

export interface BuildingFacadeViewProps {
  projectId: string;
  themeColor: string;
  project: BuildingFacadeProject;
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
}


















