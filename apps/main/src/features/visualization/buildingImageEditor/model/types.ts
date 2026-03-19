import type { Shape } from "@/components/visualization/polygon-editor/GeometryShapes";

export { type BuildingFloor } from "@/features/visualization/buildingFacade/model/types";

export interface BuildingImageEditorProps {
  projectId: string;
  currentImageUrl?: string | null;
  onImageUpdate?: (imageUrl: string) => void;
}

export interface ProjectFacade {
  id: string;
  project_id: string;
  name: string;
  image_url: string | null;
  order_index: number;
}

export interface FacadeDisplaySettings {
  colors: { building: string };
  opacity: { normal: number; hover: number };
  hoverEffects: {
    scale: boolean;
    colorChange: boolean;
    opacityChange: boolean;
    glow: boolean;
  };
  display: { showNumbers: boolean; showTooltip: boolean };
}

export interface BuildingDataSnapshot {
  floors: number;
  facades: ProjectFacade[];
  selectedFacadeId: string | null;
  buildingImage: string | null;
  buildingFloors: import("@/features/visualization/buildingFacade/model/types").BuildingFloor[];
  shapes: Shape[];
  apartmentNumbers: number[];
  facadeDisplaySettings: FacadeDisplaySettings;
}
