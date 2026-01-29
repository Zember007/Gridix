import { useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@gridix/utils/react';
import { ViewModeButtons } from './ViewModeButtons';
import { CompactFilters } from './filters/CompactFilters';
import { AdvancedFilters } from './filters/AdvancedFilters';
import type { Project } from '@/entities/project/queries/useProjects';
import type { ProjectFilters } from './hooks/useProjectFilters';
import { LanguageToggle } from '@gridix/ui';
import { Language, LANGUAGE_CONFIG } from "@gridix/utils/lib";

interface ProjectHeaderProps {
  project: Project;
  filtersRef: React.RefObject<HTMLDivElement>;
  isWidget: boolean;
  isMobile: boolean;
  viewMode: 'facade' | 'floor-plan' | 'list' | 'map' | 'favorites' | 'chess';
  setViewMode: (mode: ProjectHeaderProps['viewMode']) => void;
  favoritesCount: number;
  mapVisible: boolean;
  projectType: 'building' | 'object' | null;
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
  const { t, language, setLanguage } = useLanguage();

  const allowedLanguages: Language[] | null = Array.isArray(
    (project as unknown as { available_languages?: unknown }).available_languages
  )
    ? ((project as unknown as { available_languages?: unknown }).available_languages as unknown[])
        .filter((v): v is Language => typeof v === 'string' && v in LANGUAGE_CONFIG)
    : null;

  // If current language is not allowed for this project, redirect to the first allowed language.
  useEffect(() => {
    if (!allowedLanguages || allowedLanguages.length === 0) return;
    if (allowedLanguages.includes(language)) return;
    const first = allowedLanguages[0];
    if (first) setLanguage(first);
  }, [allowedLanguages?.join(','), language, setLanguage]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US').format(Math.round(price));

  return (
    <div ref={filtersRef} className="bg-white sticky top-0 z-40">
      <div className="container mx-auto md:px-6 md:py-3 py-2 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">

          <h1
            className="font-bold text-gray-900 whitespace-nowrap min-w-0 truncate"
            style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}
            title={project?.name}
          >
            {project?.name}
          </h1>

          {!isMobile && (
            <div className="min-w-0 flex-1">
              <CompactFilters
                {...filters}
                getUniqueRoomCounts={filters.getUniqueRoomCounts}
                getUniqueFloors={filters.getUniqueFloors}
                hasFreeLayout={filters.hasFreeLayout}
                project={project}
                viewMode={viewMode}
                themeColor={themeColor}
                formatPrice={formatPrice}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            {isMobile && (
              <div className="flex items-center gap-2 shrink-0">
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs px-2">
                      <SlidersHorizontal className="h-3 w-3" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="top" className="h-[90dvh]">

                    <div className="mt-6 overflow-y-auto p-4 h-full">
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
                        {...(filters.hasFreeLayout ? { hasFreeLayout: filters.hasFreeLayout } : {})}
                        project={project}
                        viewMode={viewMode}
                        themeColor={themeColor}
                        formatPrice={formatPrice}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}

            {isMobile && <div className="flex md:justify-start justify-end ">

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

            </div>}

            {isWidget ? null : <LanguageToggle allowedLanguages={allowedLanguages ?? undefined} />}
          </div>
        </div>



        {!isMobile && <div className="flex md:justify-start justify-end ">

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

        </div>}
      </div>
    </div>
  );
};




