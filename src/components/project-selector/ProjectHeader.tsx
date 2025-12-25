import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ViewModeButtons } from './ViewModeButtons';
import { CompactFilters } from './filters/CompactFilters';
import { ExpandedFilters } from './filters/ExpandedFilters';
import { MobileFilters } from './filters/MobileFilters';
import type { Project } from '@/entities/project/queries/useProjects';
import type { ProjectFilters } from './hooks/useProjectFilters';

interface ProjectHeaderProps {
  project: Project;
  filtersRef: React.RefObject<HTMLDivElement>;
  isWidget: boolean;
  isMobile: boolean;
  viewMode: 'facade' | 'floor-plan' | 'list' | 'map' | 'favorites';
  setViewMode: (mode: ProjectHeaderProps['viewMode']) => void;
  favoritesCount: number;
  mapVisible: boolean;
  projectType: 'building' | 'object' | null;
  themeColor: string;
  filters: ProjectFilters;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
  isDesktopFiltersExpanded: boolean;
  setIsDesktopFiltersExpanded: (value: boolean) => void;
  stagedPriceRange: number[] | null;
  setStagedPriceRange: (value: number[] | null) => void;
  stagedAreaRange: number[] | null;
  setStagedAreaRange: (value: number[] | null) => void;
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
  isDesktopFiltersExpanded,
  setIsDesktopFiltersExpanded,
  stagedPriceRange,
  setStagedPriceRange,
  stagedAreaRange,
  setStagedAreaRange,
}: ProjectHeaderProps) => {
  const { t, language } = useLanguage();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US').format(Math.round(price));

  return (
    <div ref={filtersRef} className="bg-white border-b sticky top-0 z-40">
      <div className="container mx-auto  md:px-6 md:py-4 py-2 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 ">
          <h1 className={` font-bold text-gray-900 whitespace-nowrap`}
          style={
            {
              fontSize: 'clamp(14px, 4vw, 18px)'
            }
          }
          >
            {project?.name}
          </h1>
          <div className={`flex ${isMobile ? 'justify-center' : 'items-center'} gap-1 md:gap-2 items-center`}>
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

            {isMobile && viewMode === 'list' && (
              <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs px-2">
                    <SlidersHorizontal className="h-3 w-3" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="top" className="h-[80vh] px-2">
                  <SheetHeader>
                    <SheetTitle>{t('project.filters')}</SheetTitle>
                    <SheetDescription>{t('project.filtersDescription')}</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6 overflow-y-auto p-4 h-[calc(100%-74px)]">
                    <MobileFilters
                      {...filters}
                      priceRange={[filters.minPrice, filters.maxPrice]}
                      getUniqueRoomCounts={filters.getUniqueRoomCounts}
                      getUniqueFloors={filters.getUniqueFloors}
                      hasFreeLayout={filters.hasFreeLayout}
                      project={project}
                      viewMode={viewMode}
                      formatPrice={formatPrice}
                      themeColor={themeColor}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {!isMobile && viewMode === 'list' && (
          <div className="space-y-4">
            <CompactFilters
              {...filters}
              getUniqueRoomCounts={filters.getUniqueRoomCounts}
              getUniqueFloors={filters.getUniqueFloors}
              hasFreeLayout={filters.hasFreeLayout}
              project={project}
              viewMode={viewMode}
              themeColor={themeColor}
              isDesktopFiltersExpanded={isDesktopFiltersExpanded}
              setIsDesktopFiltersExpanded={() => {
                if (!isDesktopFiltersExpanded) {
                  setStagedPriceRange([...filters.priceRange]);
                  setStagedAreaRange([...filters.areaRange]);
                }
                setIsDesktopFiltersExpanded(!isDesktopFiltersExpanded);
              }}
            />

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                isDesktopFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pt-4 border-t border-gray-200">
                <ExpandedFilters
                  priceRange={stagedPriceRange ?? filters.priceRange}
                  setPriceRange={v => setStagedPriceRange(v)}
                  areaRange={stagedAreaRange ?? filters.areaRange}
                  setAreaRange={v => setStagedAreaRange(v)}
                  selectedCurrency={filters.selectedCurrency}
                  minPrice={filters.minPrice}
                  maxPrice={filters.maxPrice}
                  minArea={filters.minArea}
                  maxArea={filters.maxArea}
                  formatPrice={formatPrice}
                  themeColor={themeColor}
                />
                <div className="flex justify-end mt-4">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (stagedPriceRange) filters.setPriceRange(stagedPriceRange);
                      if (stagedAreaRange) filters.setAreaRange(stagedAreaRange);
                      setIsDesktopFiltersExpanded(false);
                    }}
                    style={{ backgroundColor: themeColor, color: '#fff' }}
                  >
                    {language === 'ru' ? 'Применить' : 'Apply'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};




