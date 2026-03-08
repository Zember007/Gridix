import { RefObject, useEffect } from "react";
import { LanguageToggle, Sheet, SheetContent, SheetTrigger } from "@gridix/ui";
import { SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { CompactFilters, ViewModeButtons } from "@/components";
import { AdvancedFilters } from "@/features/project-selector/advanced-filters";
import type { Project } from "@/entities/project/queries/useProjects";
import type { ProjectFilters } from "./hooks/useProjectFilters";
import { cn, Language, LANGUAGE_CONFIG } from "@gridix/utils/lib";

interface ProjectHeaderProps {
  project: Project;
  filtersRef: RefObject<HTMLDivElement>;
  isWidget: boolean;
  isMobile: boolean;
  viewMode: "facade" | "floor-plan" | "list" | "map" | "favorites" | "chess";
  setViewMode: (mode: ProjectHeaderProps["viewMode"]) => void;
  favoritesCount: number;
  mapVisible: boolean;
  projectType: "building" | "object" | null;
  themeColor: string;
  filters: ProjectFilters;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
}

export const ProjectHeader = ({
  project,
  filtersRef,
  isWidget,
  isMobile,
  viewMode,
  setViewMode,
  favoritesCount,
  mapVisible,
  projectType,
  themeColor,
  filters,
  isFiltersOpen,
  setIsFiltersOpen,
}: ProjectHeaderProps) => {
  const { language, setLanguage } = useLanguage();

  const allowedLanguages: Language[] | null = Array.isArray(
    (project as unknown as { available_languages?: unknown })
      .available_languages,
  )
    ? (
        (project as unknown as { available_languages?: unknown })
          .available_languages as unknown[]
      ).filter(
        (v): v is Language => typeof v === "string" && v in LANGUAGE_CONFIG,
      )
    : null;

  // If current language is not allowed for this project, redirect to the first allowed language.
  useEffect(() => {
    if (!allowedLanguages || allowedLanguages.length === 0) return;
    if (allowedLanguages.includes(language)) return;
    const first = allowedLanguages[0];
    if (first) setLanguage(first);
  }, [allowedLanguages?.join(","), language, setLanguage]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US").format(Math.round(price));
  return (
    <div ref={filtersRef} className="sticky top-0 z-40 bg-white">
      <div className="container mx-auto flex flex-col py-2 md:px-6 md:py-3">
        <div className={cn("flex items-center justify-between gap-4")}>
          {!isWidget && (
            <h1
              className="min-w-0 truncate whitespace-nowrap font-bold text-gray-900"
              style={{ fontSize: "clamp(14px, 2vw, 18px)" }}
              title={project?.name}
            >
              {project?.name}
            </h1>
          )}
          {!isMobile && (
            <div className={cn("min-w-0", !isWidget && "flex-1")}>
              <CompactFilters
                {...filters}
                getUniqueRoomCounts={filters.getUniqueRoomCounts}
                getUniqueFloors={filters.getUniqueFloors}
                hasFreeLayout={filters.hasFreeLayout}
                project={project}
                viewMode={viewMode}
                setViewMode={setViewMode}
                themeColor={themeColor}
                formatPrice={formatPrice}
                visibleFilterFields={filters.visibleFilterFields}
                hasAnyVisibleFilter={filters.hasAnyVisibleFilter}
              />
            </div>
          )}
          {isWidget && !isMobile && (
            <div className="custom-scrollbar flex max-w-full overflow-x-auto overflow-y-hidden">
              <ViewModeButtons
                viewMode={viewMode}
                setViewMode={setViewMode}
                favoritesCount={favoritesCount}
                isMobile={isMobile}
                mapVisible={mapVisible}
                projectType={projectType}
                themeColor={themeColor}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            {isMobile && (
              <div className="flex shrink-0 items-center gap-2">
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger
                    aria-label="Open filters"
                    className="inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-2 text-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                  </SheetTrigger>
                  <SheetContent side="top" className="h-[90dvh] p-0">
                    <div className="mt-6 h-full overflow-y-auto">
                      <AdvancedFilters
                        open={isFiltersOpen}
                        onClose={() => setIsFiltersOpen(false)}
                        selectedRooms={filters.selectedRooms}
                        setSelectedRooms={filters.setSelectedRooms}
                        selectedFloor={filters.selectedFloor}
                        setSelectedFloor={filters.setSelectedFloor}
                        selectedType={filters.selectedType}
                        setSelectedType={filters.setSelectedType}
                        searchQuery={filters.searchQuery}
                        setSearchQuery={filters.setSearchQuery}
                        selectedCurrency={filters.selectedCurrency}
                        setSelectedCurrency={filters.setSelectedCurrency}
                        showOnlyAvailable={filters.showOnlyAvailable}
                        setShowOnlyAvailable={filters.setShowOnlyAvailable}
                        priceRange={filters.priceRange}
                        setPriceRange={filters.setPriceRange}
                        areaRange={filters.areaRange}
                        setAreaRange={filters.setAreaRange}
                        minPrice={filters.minPrice}
                        maxPrice={filters.maxPrice}
                        minArea={filters.minArea}
                        maxArea={filters.maxArea}
                        resetFilters={filters.resetFilters}
                        getUniqueRoomCounts={filters.getUniqueRoomCounts}
                        getUniqueFloors={filters.getUniqueFloors}
                        {...(filters.hasFreeLayout
                          ? { hasFreeLayout: filters.hasFreeLayout }
                          : {})}
                        project={project}
                        viewMode={viewMode}
                        setViewMode={setViewMode}
                        themeColor={themeColor}
                        formatPrice={formatPrice}
                        visibleFilterFields={filters.visibleFilterFields}
                        hasAnyVisibleFilter={filters.hasAnyVisibleFilter}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            {isMobile && (
              <div className="flex justify-end md:justify-start">
                <ViewModeButtons
                  isWidget={isWidget}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  favoritesCount={favoritesCount}
                  isMobile={isMobile}
                  mapVisible={mapVisible}
                  projectType={projectType}
                  themeColor={themeColor}
                />
              </div>
            )}

            {isWidget ? null : (
              <LanguageToggle
                allowedLanguages={allowedLanguages ?? undefined}
              />
            )}
          </div>
        </div>

        {!isMobile && !isWidget && (
          <div className="custom-scrollbar flex max-w-full overflow-x-auto overflow-y-hidden pt-4">
            <ViewModeButtons
              viewMode={viewMode}
              setViewMode={setViewMode}
              favoritesCount={favoritesCount}
              isMobile={isMobile}
              mapVisible={mapVisible}
              projectType={projectType}
              themeColor={themeColor}
            />
          </div>
        )}
      </div>
    </div>
  );
};
