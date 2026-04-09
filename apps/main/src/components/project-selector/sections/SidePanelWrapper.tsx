import { ProjectSidePanel, type SidePanelState } from "../ProjectSidePanel";
import type { Apartment } from "@/entities/apartment/model/types";
import type { Project } from "@/entities/project/queries/useProjects";
import type { Tables } from "@gridix/types/database";
import type { SubProjectListItem } from "@/features/projectSelector/api/projectSelectorApi";
import type { FieldVisibility, LayoutPhoto } from "../types";

interface SidePanelWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: SidePanelState | null;
  project: Project;
  language: string;
  themeColor: string;
  t: (key: string, options?: Record<string, unknown>) => unknown;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  filteredApartments: Apartment[];
  onOpenApartmentDetails: (apartment: Apartment) => void;
  onOpenFloorPlan: (floorNumber: number) => void;
  selectedCurrency: string;
  fieldVisibility: FieldVisibility;
  subProject?: Tables<"sub_projects"> | null;
  subProjects: SubProjectListItem[];
}

export const SidePanelWrapper = ({
  open,
  onOpenChange,
  state,
  project,
  language,
  themeColor,
  t,
  preloadedLayoutPhotosByRooms,
  filteredApartments,
  onOpenApartmentDetails,
  onOpenFloorPlan,
  selectedCurrency,
  fieldVisibility,
  subProject,
  subProjects,
}: SidePanelWrapperProps) => {
  const panelProps = {
    open,
    onOpenChange,
    state,
    project,
    language,
    themeColor,
    t,
    preloadedLayoutPhotosByRooms,
    filteredApartments,
    onOpenApartmentDetails,
    onOpenFloorPlan,
    selectedCurrency,
    fieldVisibility,
    subProject,
    subProjects,
  };

  return (
    <>
      {/* Desktop push panel */}
      <div
        className="hidden border-l border-gray-100 bg-white shadow-2xl transition-[width] duration-300 ease-in-out md:block"
        style={{ width: open ? "35vw" : "0px" }}
      >
        {open && <ProjectSidePanel {...panelProps} />}
      </div>

      {/* Mobile overlay panel */}
      <div
        className={`fixed right-0 top-0 z-50 h-full border-l border-gray-100 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "100vw" }}
      >
        {open && <ProjectSidePanel {...panelProps} />}
      </div>
    </>
  );
};
