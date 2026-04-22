import { Suspense, lazy } from "react";
import ApartmentFloorPlan from "@/features/apartment-floor-plan/ui/ApartmentFloorPlan";
import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import type { FieldSetting } from "@/hooks/useFields";

const FloorSelector = lazy(() =>
  import("../FloorSelector").then((module) => ({
    default: module.FloorSelector,
  })),
);

interface FloorPlanSectionProps {
  project: Project;
  subProjectId?: string | null;
  filteredApartments: Apartment[];
  allApartments: Apartment[];
  selectedFloorForPlan: number | null;
  setSelectedFloorForPlan: (floor: number | null) => void;
  onApartmentSelect: (apartment: Apartment) => void;
  visibleFields: FieldSetting[];
  getUniqueFloors: () => number[];
  themeColor: string;
  showOnlyAvailable: boolean;
  isMobile: boolean;
  selectedCurrency: string;
}

export const FloorPlanSection = ({
  project,
  subProjectId,
  filteredApartments,
  allApartments,
  selectedFloorForPlan,
  setSelectedFloorForPlan,
  onApartmentSelect,
  visibleFields,
  getUniqueFloors,
  themeColor,
  showOnlyAvailable,
  isMobile,
  selectedCurrency,
}: FloorPlanSectionProps) => (
  <div className="h-full min-h-[600px] w-full bg-white px-4 md:px-0">
    <div className={`flex ${isMobile ? "flex-col" : "flex-row"} h-full`}>
      {/* Main floor plan area */}
      <div className="relative flex-1">
        <ApartmentFloorPlan
          project={project}
          projectId={project.id}
          subProjectId={subProjectId}
          apartments={filteredApartments.filter((apt) =>
            selectedFloorForPlan !== null
              ? apt.floor_number === selectedFloorForPlan
              : true,
          )}
          onApartmentSelect={onApartmentSelect}
          selectedFloorNumber={selectedFloorForPlan ?? 0}
          visibleFields={visibleFields}
          selectedCurrency={selectedCurrency}
        />
      </div>

      <Suspense fallback={null}>
        <FloorSelector
          selectedFloorForPlan={selectedFloorForPlan}
          setSelectedFloorForPlan={setSelectedFloorForPlan}
          getUniqueFloors={getUniqueFloors}
          themeColor={themeColor}
          apartments={allApartments}
          showOnlyAvailable={showOnlyAvailable}
          filteredApartments={filteredApartments}
        />
      </Suspense>
    </div>
  </div>
);
