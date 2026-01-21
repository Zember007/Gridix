import { Input } from '@/shared/ui/input';
import { Check, ChevronDown, Search, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Slider } from '@/shared/ui/slider';
import { cn } from '@/shared/lib/utils';
import { getCurrencySymbolSafe } from '@/shared/lib/currency-utils';
import { useEffect, useMemo, useState } from 'react';
import { AdvancedFilters } from './AdvancedFilters';

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
  priceRange: number[];
  setPriceRange: (value: number[]) => void;
  areaRange: number[];
  setAreaRange: (value: number[]) => void;
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

  // --- Per-filter popovers with staged values + Apply button
  const [typeOpen, setTypeOpen] = useState(false);
  const [roomsOpen, setRoomsOpen] = useState(false);
  const [priceOpen, setPriceOpenPopover] = useState(false);
  const [areaOpen, setAreaOpenPopover] = useState(false);

  const [stagedType, setStagedType] = useState<typeof selectedType>(selectedType);
  const [stagedRooms, setStagedRooms] = useState<string>(selectedRooms);
  const [stagedPrice, setStagedPrice] = useState<number[]>(priceRange);
  const [stagedArea, setStagedArea] = useState<number[]>(areaRange);

  useEffect(() => { if (typeOpen) setStagedType(selectedType); }, [typeOpen, selectedType]);
  useEffect(() => { if (roomsOpen) setStagedRooms(selectedRooms); }, [roomsOpen, selectedRooms]);
  useEffect(() => { if (priceOpen) setStagedPrice(priceRange); }, [priceOpen, priceRange]);
  useEffect(() => { if (areaOpen) setStagedArea(areaRange); }, [areaOpen, areaRange]);

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
        <PopoverContent align="start" className="w-[420px] max-h-[calc(100vh-150px)] overflow-y-auto p-4">
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

      {/* Rooms filter (hide for villas) */}
      {project?.project_type !== 'object' && (
        <Popover open={roomsOpen} onOpenChange={setRoomsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-full hover:bg-gray-50 border-gray-200 px-3 gap-2 font-normal [&_svg]:size-3"
            >
              <span className="text-gray-700">{t('project.rooms')}</span>

              <ChevronDown className="h-4 w-4 text-gray-400" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[320px] p-2">
            <div className="max-h-[260px] overflow-y-auto">
              {roomsOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm hover:bg-gray-50',
                    stagedRooms === o.value && 'bg-gray-50',
                  )}
                  onClick={() => setStagedRooms(o.value)}
                >
                  <span className="text-gray-800">{o.label}</span>
                  {stagedRooms === o.value && <Check className="h-4 w-4 text-gray-900" />}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <Button
                onClick={() => {
                  setSelectedRooms(stagedRooms);
                  setRoomsOpen(false);
                }}
                style={{ backgroundColor: themeColor, color: '#fff' }}
              >
                {ui.apply}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

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

      {/* Price */}
      <Popover open={priceOpen} onOpenChange={setPriceOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full hover:bg-gray-50 border-gray-200 px-3 gap-2 font-normal [&_svg]:size-3"
          >
            <span className="text-gray-700">{t('project.price')}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[340px]">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              {t('project.price')}
            </div>
            <div className="text-xs text-gray-500">
              {formatPrice(stagedPrice[0] ?? minPrice)}–{formatPrice(stagedPrice[1] ?? maxPrice)} {getCurrencySymbolSafe(selectedCurrency)}
            </div>
            <Slider
              value={stagedPrice}
              onValueChange={setStagedPrice}
              max={maxPrice}
              min={minPrice}
              step={1}
              className="w-full"
              style={
                {
                  '--slider-thumb-color': themeColor,
                  '--slider-range-color': themeColor,
                } as React.CSSProperties
              }
            />
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  setPriceRange(stagedPrice);
                  setPriceOpenPopover(false);
                }}
                style={{ backgroundColor: themeColor, color: '#fff' }}
              >
                {ui.apply}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Area */}
      <Popover open={areaOpen} onOpenChange={setAreaOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full hover:bg-gray-50 border-gray-200 px-3 gap-2 font-normal [&_svg]:size-3"
          >
            <span className="text-gray-700">{t('project.area')}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[340px]">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              {t('project.area')}
            </div>
            <div className="text-xs text-gray-500">
              {(stagedArea[0] ?? minArea)}–{(stagedArea[1] ?? maxArea)} м²
            </div>
            <Slider
              value={stagedArea}
              onValueChange={setStagedArea}
              max={maxArea}
              min={minArea}
              step={1}
              className="w-full"
              style={
                {
                  '--slider-thumb-color': themeColor,
                  '--slider-range-color': themeColor,
                } as React.CSSProperties
              }
            />
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  setAreaRange(stagedArea);
                  setAreaOpenPopover(false);
                }}
                style={{ backgroundColor: themeColor, color: '#fff' }}
              >
                {ui.apply}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Search (popover to save space) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full p-0 hover:bg-gray-50 border-gray-200 [&_svg]:size-4"
            aria-label={t('project.apartmentNumber')}
            title={t('project.apartmentNumber')}
          >
            <Search className="h-2 w-2 text-gray-500" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[260px] p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('project.apartmentNumber')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>

  );
};
