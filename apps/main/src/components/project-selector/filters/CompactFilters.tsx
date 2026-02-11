import {Button, Popover, PopoverContent, PopoverTrigger} from "@gridix/ui";
import {SlidersHorizontal} from 'lucide-react';
import {useLanguage} from '@/contexts/LanguageContext';
import {Tables} from '@gridix/types/database';
import {useState} from 'react';
import {AdvancedFilters} from '@/components';

type Project = Tables<'projects'>;

interface CompactFiltersProps {
  selectedRooms: string;
  setSelectedRooms: (value: string) => void;
  selectedFloor: string;
  setSelectedFloor: (value: string) => void;
  selectedType: 'all' | 'apartment' | 'commercial' | 'parking';
  setSelectedType: (value: 'all' | 'apartment' | 'commercial' | 'parking') => void;
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
  setViewMode: (mode: 'facade' | 'floor-plan' | 'list' | 'map' | 'favorites' | 'chess') => void;
  themeColor?: string;
  isPriceVisible: boolean;
  isAreaVisible: boolean;
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
  themeColor = '#000000',
  isPriceVisible,
  isAreaVisible,
}: CompactFiltersProps) => {
  const { t } = useLanguage();

  // Advanced filters popover (left icon)
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // (staging + apply/reset lives inside AdvancedFilters component)

  return (
    <div className="flex items-center gap-2 flex-wrap min-w-0">
      {/* Left: advanced filters */}
      <Popover open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full p-0 bg-white border-gray-200 [&_svg]:size-4 basis-9 shrink-0"
            aria-label={t('project.filters')}
            title={t('project.filters')}
          >
            <SlidersHorizontal className="h-4 w-4 text-gray-700" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-w-[500px] max-h-[calc(100vh-150px)] overflow-y-auto relative p-0">
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
            isPriceVisible={isPriceVisible}
            isAreaVisible={isAreaVisible}
          />
        </PopoverContent>
      </Popover>
    </div>

  );
};
