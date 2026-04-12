import { Popover, PopoverContent, PopoverTrigger } from "@gridix/ui";
import { SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tables } from "@gridix/types/database";
import { useState } from "react";
import { AdvancedFilters } from "@/features/project-selector/advanced-filters";
import type {
  ApartmentTypeFilter,
  FilterFieldKey,
} from "../hooks/useProjectFilters";

type Project = Tables<"projects">;

interface CompactFiltersProps {
  selectedRooms: string;
  setSelectedRooms: (value: string) => void;
  selectedFloor: string;
  setSelectedFloor: (value: string) => void;
  selectedType: ApartmentTypeFilter;
  setSelectedType: (value: ApartmentTypeFilter) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedCurrency: string;
  setSelectedCurrency: (value: string) => void;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (value: boolean) => void;
  priceRange: [number, number];
  setPriceRange: (value: [number, number]) => void;
  areaRange: [number, number];
  setAreaRange: (value: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  formatPrice: (price: number) => string;
  resetFilters: () => void;
  getUniqueRoomCounts: () => number[];
  getUniqueFloors: () => number[];
  hasFreeLayout?: () => boolean;
  project?: Project;
  viewMode: string;
  setViewMode: (
    mode: "facade" | "floor-plan" | "list" | "map" | "favorites" | "chess",
  ) => void;
  themeColor?: string;
  visibleFilterFields: Record<FilterFieldKey, boolean>;
  hasAnyVisibleFilter: boolean;
  projectType: "building" | "object";
}

export const CompactFilters = ({
  selectedRooms,
  setSelectedRooms,
  selectedFloor,
  setSelectedFloor,
  selectedType,
  setSelectedType,
  searchQuery,
  setSearchQuery,
  selectedCurrency,
  setSelectedCurrency,
  showOnlyAvailable,
  setShowOnlyAvailable,
  priceRange,
  setPriceRange,
  areaRange,
  setAreaRange,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  formatPrice,
  resetFilters,
  getUniqueRoomCounts,
  getUniqueFloors,
  hasFreeLayout,
  project,
  viewMode,
  setViewMode,
  themeColor = "#000000",
  visibleFilterFields,
  hasAnyVisibleFilter,
  projectType,
}: CompactFiltersProps) => {
  const { t } = useLanguage();

  // Advanced filters popover (left icon)
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // (staging + apply/reset lives inside AdvancedFilters component)

  return (
    <div className="inline-flex shrink-0 flex-nowrap items-center gap-2">
      {/* Left: advanced filters */}
      <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <PopoverTrigger
          aria-label={t("project.filters")}
          title={t("project.filters")}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white p-0 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
        >
          <SlidersHorizontal className="h-4 w-4 text-gray-700" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="relative max-h-[calc(100vh-150px)] max-w-[500px] overflow-y-auto p-0"
        >
          <AdvancedFilters
            open={advancedOpen}
            onClose={() => setAdvancedOpen(false)}
            selectedRooms={selectedRooms}
            setSelectedRooms={setSelectedRooms}
            selectedFloor={selectedFloor}
            setSelectedFloor={setSelectedFloor}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            showOnlyAvailable={showOnlyAvailable}
            setShowOnlyAvailable={setShowOnlyAvailable}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            areaRange={areaRange}
            setAreaRange={setAreaRange}
            minPrice={minPrice}
            maxPrice={maxPrice}
            minArea={minArea}
            maxArea={maxArea}
            resetFilters={resetFilters}
            getUniqueRoomCounts={getUniqueRoomCounts}
            getUniqueFloors={getUniqueFloors}
            {...(hasFreeLayout ? { hasFreeLayout } : {})}
            {...(project ? { project } : {})}
            viewMode={viewMode}
            setViewMode={setViewMode}
            themeColor={themeColor}
            formatPrice={formatPrice}
            visibleFilterFields={visibleFilterFields}
            hasAnyVisibleFilter={hasAnyVisibleFilter}
            projectType={projectType}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
