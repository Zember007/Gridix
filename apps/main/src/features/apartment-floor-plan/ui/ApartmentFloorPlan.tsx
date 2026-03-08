import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@/contexts/LanguageContext";
import FloorPlanView from "@/components/visualization/FloorPlanView";
import { Project } from "@/entities/project/queries/useProjectsManager";
import { FieldSetting } from "@/hooks/useFields";
import { loadSelectorFloorsLight } from "@/features/projectSelector/api/projectSelectorApi";

interface ApartmentFloorPlanProps {
  projectId: string;
  apartments: Apartment[];
  onApartmentSelect: (apartment: Apartment) => void;
  selectedFloorNumber?: number;
  project: Project;
  visibleFields?: FieldSetting[];
  selectedCurrency?: string;
}

interface BuildingFloor {
  id: string;
  floor_number: number;
  polygon: { x: number; y: number }[];
  color: string;
}

const ApartmentFloorPlan = ({
  project,
  projectId,
  apartments,
  onApartmentSelect,
  selectedFloorNumber,
  visibleFields = [],
  selectedCurrency,
}: ApartmentFloorPlanProps) => {
  const { t } = useLanguage();
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);

  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const { floors } = await loadSelectorFloorsLight(projectId);

        setBuildingFloors(
          floors.map((f) => ({
            id: f.id,
            floor_number: f.floor_number,
            polygon: [],
            color: "#000000",
          })),
        );
      } catch (error) {
        console.error("Error loading building floors:", error);
      }
    };

    fetchFloors();
  }, [projectId]);

  const selectedFloor =
    typeof selectedFloorNumber === "number"
      ? selectedFloorNumber
      : buildingFloors.length > 0
        ? (buildingFloors[0]?.floor_number ?? null)
        : null;

  if (!buildingFloors.length || selectedFloor === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Building2 className="mb-4 h-16 w-16" />
        <p className="text-lg font-medium">{t("project.noBuildingPlan")}</p>
        <p className="text-sm">{t("project.contactAdmin")}</p>
      </div>
    );
  }

  const floorApartments = apartments.filter(
    (apt) => apt.floor_number === selectedFloor,
  );

  return (
    <FloorPlanView
      currency={project?.currency}
      projectId={projectId}
      floorNumber={selectedFloor}
      apartments={floorApartments}
      onApartmentSelect={onApartmentSelect}
      visibleFields={visibleFields}
      selectedCurrency={selectedCurrency}
    />
  );
};

export default ApartmentFloorPlan;
