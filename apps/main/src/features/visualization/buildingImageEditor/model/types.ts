import type { Shape } from "@/components/visualization/polygon-editor/GeometryShapes";
import type {
  MasterplanArea,
  SubProject as GenplanSubProject,
  InfrastructureZone,
} from "@/features/genplan/model/types";

export { type BuildingFloor } from "@/features/visualization/buildingFacade/model/types";

export interface GenplanEditorConfig {
  masterplanId?: string;
  areas: MasterplanArea[];
  subProjects: GenplanSubProject[];
  infrastructureZones: InfrastructureZone[];
  onMasterplanUpdated: () => void;
}

export interface BuildingImageEditorProps {
  projectId: string;
  /** When set, editor operates in subproject scope — facades/floors are filtered and created with this sub_project_id. */
  subProjectId?: string;
  /** Floors count for this scope (subproject.floors). Overrides project.floors. */
  initialFloors?: number;
  /** Project type for this scope (subproject.type). Overrides project.project_type.
   *  Use "genplan" to render the genplan polygon editor instead of the building/floor editor. */
  subProjectType?: "building" | "object" | "genplan";
  currentImageUrl?: string | null;
  onImageUpdate?: (imageUrl: string) => void;
  /** Required when subProjectType="genplan". Provides masterplan data for the genplan editor. */
  genplan?: GenplanEditorConfig;
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
