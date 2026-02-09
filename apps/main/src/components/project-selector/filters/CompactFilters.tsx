import {Button, Popover, PopoverContent, PopoverTrigger} from "@gridix/ui";
import {SlidersHorizontal} from 'lucide-react';
import {useLanguage} from '@/contexts/LanguageContext';
import {Tables} from '@gridix/types/database';
import {useMemo, useState} from 'react';
import {AdvancedFilters} from './AdvancedFilters';

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
  themeColor?: string;
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
  themeColor = '#000000',
}: CompactFiltersProps) => {
  const { t, language } = useLanguage();

  const ui = useMemo(() => ({
    apply: language === 'ru' ? 'Применить' : 'Apply',
  }), [language]);

  const roomsOptions = useMemo(() => {
    const base = [{ value: 'all', label: t('project.allTypes') }];
    const nums = getUniqueRoomCounts().map((rooms) => ({
      value: rooms.toString(),
      label: rooms === 0 ? t('apartment.studio') : `${rooms} ${t('apartment.room')}`,
    }));
    const free = (hasFreeLayout && hasFreeLayout())
      ? [{ value: 'free_layout', label: t('apartment.freeLayout') }]
      : [];
    return [...base, ...nums, ...free];
  }, [getUniqueRoomCounts, hasFreeLayout, t]);

  // Note: floor is only available in AdvancedFilters now.

  const typeOptions = useMemo(() => {
    const base = [{ value: 'all' as const, label: t('project.allTypes') }];
    const apt = [{ value: 'apartment' as const, label: t('apartmentsManager.typeApartment') }];
    const comm = project?.has_commercial ? [{ value: 'commercial' as const, label: t('apartmentsManager.typeCommercial') }] : [];
    const park = project?.has_parking ? [{ value: 'parking' as const, label: t('apartmentsManager.typeParking') }] : [];
    return [...base, ...apt, ...comm, ...park];
  }, [project?.has_commercial, project?.has_parking, t]);

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
            className="h-9 w-9 rounded-full p-0 bg-white border-gray-200 [&_svg]:size-4"
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
            themeColor={themeColor}
            formatPrice={formatPrice}
          />
        </PopoverContent>
      </Popover>

      {/* Type filter - only show if project has commercial or parking */}
    {/*   {(project?.has_commercial || project?.has_parking) && (
        <Popover open={typeOpen} onOpenChange={setTypeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full hover:bg-gray-50 border-gray-200 px-3 gap-2 font-normal [&_svg]:size-3"
            >
              <span className="text-gray-700">{t('project.type')}</span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[320px] p-2">
            <div className="max-h-[260px] overflow-y-auto">
              {typeOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-gray-50',
                    stagedType === o.value && 'bg-gray-50',
                  )}
                  onClick={() => setStagedType(o.value)}
                >
                  <span className="text-gray-800">{o.label}</span>
                  {stagedType === o.value && <Check className="h-4 w-4 text-gray-900" />}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <Button
                onClick={() => {
                  setSelectedType(stagedType);
                  setTypeOpen(false);
                }}
                style={{ backgroundColor: themeColor, color: '#fff' }}
              >
                {ui.apply}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )} */}
    </div>

  );
};
