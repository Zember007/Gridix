import {useEffect, useMemo, useRef, useState} from 'react';
import {Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Slider} from "@gridix/ui";
import {cn, getCurrencySymbolSafe} from "@gridix/utils/lib";
import {RotateCcw} from 'lucide-react';
import CurrencyToggle from '@/components/common/CurrencyToggle';
import {useLanguage} from '@/contexts/LanguageContext';

type ProjectLike = {
  currency?: string | null;
  has_commercial?: boolean | null;
  has_parking?: boolean | null;
  project_type?: string | null;
};

type Props = {
  open: boolean;
  onClose?: () => void;
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
  resetFilters: () => void;
  getUniqueRoomCounts: () => number[];
  getUniqueFloors: () => number[];
  hasFreeLayout?: () => boolean;
  project?: ProjectLike;
  viewMode: string;
  themeColor?: string;
  formatPrice: (price: number) => string;
};

export const AdvancedFilters = ({
  open,
  onClose,
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
  resetFilters,
  getUniqueRoomCounts,
  getUniqueFloors,
  hasFreeLayout,
  project,
  viewMode,
  themeColor = '#000000',
  formatPrice,
}: Props) => {
  const { t, language } = useLanguage();

  const ui = useMemo(() => ({
    apply: language === 'ru' ? 'Применить' : 'Apply',
    reset: language === 'ru' ? 'Сброс' : 'Reset',
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

  const floorOptions = useMemo(() => {
    const base = [{ value: 'all', label: t('project.allFloors') }];
    const nums = getUniqueFloors().map((floor) => ({
      value: floor.toString(),
      label: `${floor} ${t('project.floor').toLowerCase()}`,
    }));
    return [...base, ...nums];
  }, [getUniqueFloors, t]);

  const typeOptions = useMemo(() => {
    const base = [{ value: 'all' as const, label: t('project.allTypes') }];
    const apt = [{ value: 'apartment' as const, label: t('apartmentsManager.typeApartment') }];
    const comm = project?.has_commercial ? [{ value: 'commercial' as const, label: t('apartmentsManager.typeCommercial') }] : [];
    const park = project?.has_parking ? [{ value: 'parking' as const, label: t('apartmentsManager.typeParking') }] : [];
    return [...base, ...apt, ...comm, ...park];
  }, [project?.has_commercial, project?.has_parking, t]);

  const [advType, setAdvType] = useState(selectedType);
  const [advRooms, setAdvRooms] = useState(selectedRooms);
  const [advFloor, setAdvFloor] = useState(selectedFloor);
  const [advPrice, setAdvPrice] = useState(priceRange);
  const [advArea, setAdvArea] = useState(areaRange);
  const [advAvailable, setAdvAvailable] = useState(showOnlyAvailable);
  const [advSearch, setAdvSearch] = useState(searchQuery);
  const [advCurrency, setAdvCurrency] = useState(selectedCurrency);

  useEffect(() => {
    if (!open) return;
    setAdvType(selectedType);
    setAdvRooms(selectedRooms);
    setAdvFloor(selectedFloor);
    setAdvPrice(priceRange);
    setAdvArea(areaRange);
    setAdvAvailable(showOnlyAvailable);
    setAdvSearch(searchQuery);
    setAdvCurrency(selectedCurrency);
  }, [
    open,
    selectedType,
    selectedRooms,
    selectedFloor,
    priceRange,
    areaRange,
    showOnlyAvailable,
    searchQuery,
    selectedCurrency,
  ]);

  const handleApplyFilters = () => {
    const currencyChanged = advCurrency !== selectedCurrency;

    if (currencyChanged) {
      setSelectedCurrency(advCurrency);
    }

    setSelectedType(advType);
    setSelectedRooms(advRooms);
    setSelectedFloor(advFloor);

    if (!currencyChanged) {
      setPriceRange(advPrice);
      setAreaRange(advArea);
    }

    setSearchQuery(advSearch);
    setShowOnlyAvailable(advAvailable);

    onClose?.();
    window.scrollTo({
      top: 650,
      behavior: "smooth",
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 p-4 pb-0 relative ">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-900">{t('project.filters')}</div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => {
            resetFilters();
            onClose?.();
          }}
        >
          <RotateCcw className="h-4 w-4" />
          {t('project.resetFilters') || ui.reset}
        </Button>
      </div>

      {/* Currency (only in advanced) */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">{t('project.currency')}</div>
        <CurrencyToggle
          projectCurrency={project?.currency || null}
          selectedCurrency={advCurrency}
          onChange={(c) => setAdvCurrency(c)}
          themeColor={themeColor}
        />
      </div>

      {(project?.has_commercial || project?.has_parking) && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t('project.type')}</div>
          <div className="flex flex-wrap gap-2">
            {typeOptions.map(o => (
              <button
                key={o.value}
                type="button"
                className={cn(
                  'px-3 py-2 rounded-full border text-sm',
                  advType === o.value ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-600',
                )}
                onClick={() => setAdvType(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {project?.project_type !== 'object' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t('project.rooms')}</div>
          <div className="flex flex-wrap gap-2">
            {roomsOptions.map(o => (
              <button
                key={o.value}
                type="button"
                className={cn(
                  'px-3 py-2 rounded-full border text-sm',
                  advRooms === o.value ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-600',
                )}
                onClick={() => setAdvRooms(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewMode !== 'floor-plan' && project?.project_type !== 'object' && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500">{t('project.floor')}</div>
          <div className="flex flex-wrap gap-2 ">
            <Select  value={advFloor} onValueChange={setAdvFloor}>
              <SelectTrigger className="shadow-none h-auto p-0 bg-transparent px-3 py-2 rounded-full border text-sm">
                <SelectValue placeholder={t('project.parameters')} />
              </SelectTrigger>
              <SelectContent className={'h-[200px]'}>
                {floorOptions.map(o => (
                    <SelectItem className={'py-2 mb-1 rounded-full border text-sm'} key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs text-gray-500">{t('project.price')}</div>
        <div className="text-xs text-gray-700">
          {formatPrice(advPrice[0] ?? minPrice)}–{formatPrice(advPrice[1] ?? maxPrice)} {getCurrencySymbolSafe(advCurrency)}
        </div>
        <Slider
          value={advPrice}
          onValueChange={setAdvPrice}
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
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500">{t('project.area')}</div>
        <div className="text-xs text-gray-700">
          {(advArea[0] ?? minArea)}–{(advArea[1] ?? maxArea)} м²
        </div>
        <Slider
          value={advArea}
          onValueChange={setAdvArea}
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
      </div>

      <div className="space-y-2">
        <div className="text-xs text-gray-500">{t('project.apartmentNumber')}</div>
        <Input value={advSearch} onChange={(e) => setAdvSearch(e.target.value)} />
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100 sticky bottom-0 bg-gray-50 -mx-4 p-4">
        <Button
          variant="outline"
          className={cn(
            advAvailable ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-gray-200 text-gray-700',
          )}
          onClick={() => setAdvAvailable(!advAvailable)}
        >
          {t('project.onlyAvailable')}
        </Button>
        <Button
          onClick={handleApplyFilters}
          style={{ backgroundColor: themeColor, color: '#fff' }}
        >
          {ui.apply}
        </Button>
      </div>
    </div>
  );
};

