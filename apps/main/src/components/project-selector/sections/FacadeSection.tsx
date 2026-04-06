import type { RefObject } from "react";
import PolygonPlanImageView from "@/features/visualization/buildingFacade/ui/PolygonPlanImageView";
import type {
  BuildingFloor,
  FacadeSettings,
} from "@/features/visualization/buildingFacade/model/types";
import { LayoutGallery } from "../layouts/LayoutGallery";
import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import type { FieldSetting } from "@/hooks/useFields";
import type { ViewMode, LayoutPhoto } from "../types";
import type { ProjectFilters } from "../hooks/useProjectFilters";

interface FacadeSectionProps {
  project: Project;
  /** Building vs object (villa): prefer sub-project `type` when in sub-project context. */
  projectType: "building" | "object" | null;
  themeColor: string;
  imageUrl: string | null;
  filtersRef: RefObject<HTMLDivElement>;
  buildingImageLoaded: boolean;
  buildingImageNaturalSize: { width: number; height: number };
  visibleFields: FieldSetting[];
  buildingFloors: BuildingFloor[];
  facadeSettings: FacadeSettings | null;
  loading: boolean;
  facades: { id: string; name: string }[];
  activeFacadeIndex: number;
  onFacadeChange: (nextIndex: number) => void;
  onFloorSelect: (floor: number) => void;
  onApartmentSelect: (apartment: Apartment) => void;
  filters: ProjectFilters;
  setViewMode: (mode: ViewMode) => void;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  isMobile: boolean;
}

export const FacadeSection = ({
  project,
  projectType,
  themeColor,
  imageUrl,
  filtersRef,
  buildingImageLoaded,
  buildingImageNaturalSize,
  visibleFields,
  buildingFloors,
  facadeSettings,
  loading,
  facades,
  activeFacadeIndex,
  onFacadeChange,
  onFloorSelect,
  onApartmentSelect,
  filters,
  setViewMode,
  preloadedLayoutPhotosByRooms,
  isMobile,
}: FacadeSectionProps) => (
  <div className="relative flex h-full w-full flex-col overflow-hidden bg-white">
    <div className="relative min-h-0 flex-1 overflow-hidden">
      <PolygonPlanImageView
        themeColor={themeColor}
        projectId={project.id}
        project={project}
        imageUrl={imageUrl}
        apartments={filters.filteredApartments}
        onFloorSelect={onFloorSelect}
        onApartmentSelect={onApartmentSelect}
        filtersRef={filtersRef}
        externalImageLoaded={buildingImageLoaded}
        externalImageNaturalSize={buildingImageNaturalSize}
        showOnlyAvailable={filters.showOnlyAvailable}
        visibleFields={visibleFields}
        buildingFloors={buildingFloors}
        facadeSettings={facadeSettings}
        loading={loading}
        facades={facades}
        selectedCurrency={filters.selectedCurrency}
        activeFacadeIndex={activeFacadeIndex}
        onFacadeChange={onFacadeChange}
        planKind="facade"
      />
    </div>

    {(projectType ?? project?.project_type) !== "object" && (
      <LayoutGallery
        apartments={filters.filteredApartments}
        selectedRooms={filters.selectedRooms}
        selectedType={filters.selectedType}
        setSelectedRooms={filters.setSelectedRooms}
        setSelectedType={filters.setSelectedType}
        setViewMode={setViewMode}
        getUniqueRoomCounts={filters.getUniqueRoomCounts}
        hasFreeLayout={filters.hasFreeLayout}
        preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
        project={project}
        convertPrice={filters.convertPrice}
        selectedCurrency={filters.selectedCurrency}
        isMobile={isMobile}
        themeColor={themeColor}
        visibleFields={visibleFields}
      />
    )}
  </div>
);
