import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getCurrencySymbolSafe } from '@/lib/currency-utils';
import { Tables } from '@/integrations/supabase/types';
type Project = Tables<'projects'>;

interface MobileFiltersProps {
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
  priceRange: [number, number];
  setPriceRange: (value: number[]) => void;
  areaRange: number[];
  setAreaRange: (value: number[]) => void;
  showOnlyAvailable: boolean;
  setShowOnlyAvailable: (value: boolean) => void;
  getUniqueRoomCounts: () => number[];
  getUniqueFloors: () => number[];
  project?: Project;
  viewMode: string;
  minPrice: number;
  maxPrice: number;
  minArea: number;
  maxArea: number;
  formatPrice: (price: number) => string;
  themeColor?: string;
}

export const MobileFilters = ({
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
  priceRange,
  setPriceRange,
  areaRange,
  setAreaRange,
  showOnlyAvailable,
  setShowOnlyAvailable,
  getUniqueRoomCounts,
  getUniqueFloors,
  project,
  viewMode,
  minPrice,
  maxPrice,
  minArea,
  maxArea,
  formatPrice,
  themeColor = '#000000'
}: MobileFiltersProps) => {
  const { t } = useLanguage();

  const sliderStyle = {
    '--slider-thumb-color': themeColor,
    '--slider-range-color': themeColor,
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* Rooms filter (hide for villas) */}
      {project?.project_type !== 'object' && (
        <div className="space-y-2">
          <Label>{t('project.rooms')}</Label>
          <Select value={selectedRooms} onValueChange={setSelectedRooms}>
            <SelectTrigger>
              <SelectValue placeholder={t('project.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('project.allTypes')}</SelectItem>
              {getUniqueRoomCounts().map(rooms => (
                <SelectItem key={rooms} value={rooms.toString()}>
                  {rooms === 0 ? t('apartment.studio') : `${rooms} ${t('apartment.room')}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {viewMode !== 'floor-plan' && project?.project_type !== 'object' && (
        <div className="space-y-2">
          <Label>{t('project.floor')}</Label>
          <Select value={selectedFloor} onValueChange={setSelectedFloor}>
            <SelectTrigger>
              <SelectValue placeholder={t('project.allFloors')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('project.allFloors')}</SelectItem>
              {getUniqueFloors().map(floor => (
                <SelectItem key={floor} value={floor.toString()}>
                  {floor} {t('project.floor').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Type filter - only show if project has commercial or parking */}
      {(project?.has_commercial || project?.has_parking) && (
        <div className="space-y-2">
          <Label>{t('apartmentsManager.apartmentType')}</Label>
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as 'all' | 'apartment' | 'commercial' | 'parking')}>
            <SelectTrigger>
              <SelectValue placeholder={t('project.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('project.allTypes')}</SelectItem>
              <SelectItem value="apartment">{t('apartmentsManager.typeApartment')}</SelectItem>
              {project?.has_commercial && (
                <SelectItem value="commercial">{t('apartmentsManager.typeCommercial')}</SelectItem>
              )}
              {project?.has_parking && (
                <SelectItem value="parking">{t('apartmentsManager.typeParking')}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Search */}
      <div className="space-y-2">
        <Label>{t('common.search')}</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('project.apartmentNumber')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Currency filter - pill toggles */}
      {(() => {
        type Currency = 'RUB' | 'USD' | 'EUR' | 'GEL'
        const preferredOrder: Array<Exclude<Currency, 'RUB'>> = ['USD', 'GEL', 'EUR']
        const projectCurrency = (project?.currency || 'RUB') as Currency
        const list: Currency[] = [...preferredOrder, ...(preferredOrder.includes(projectCurrency as Exclude<Currency, 'RUB'>) ? [] : [projectCurrency])]
        const currenciesToShow = list.filter((c, i) => list.indexOf(c) === i)
        const symbol: Record<'RUB' | 'USD' | 'EUR' | 'GEL', string> = { RUB: '₽', USD: '$', EUR: '€', GEL: '₾' }
        return (
          <div className="space-y-2">
            <Label>{t('project.currency')}</Label>
            <ToggleGroup type="single" value={selectedCurrency} onValueChange={(v) => v && setSelectedCurrency(v)} className="gap-2">
              {currenciesToShow.map((c) => (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  size="sm"
                  aria-label={c}
                  className="rounded-full h-9 w-9 p-0 text-base bg-gray-100 text-gray-600 data-[state=on]:text-white"
                  style={{
                    '--tw-bg-opacity': selectedCurrency === c ? '1' : undefined,
                    backgroundColor: selectedCurrency === c ? themeColor : undefined
                  } as React.CSSProperties}
                >
                  {symbol[c]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )
      })()}

      {/* Price range */}
      <div className="space-y-2">
        <Label>{t('project.price')}: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} {getCurrencySymbolSafe(selectedCurrency)}</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={maxPrice}
          min={minPrice}
          step={1}
          className="w-full"
          style={sliderStyle}
        />
      </div>

      {/* Area range */}
      <div className="space-y-2">
        <Label>{t('project.area')}: {areaRange[0]} - {areaRange[1]} м²</Label>
        <Slider
          defaultValue={areaRange}
          onValueChange={setAreaRange}
          max={maxArea}
          min={minArea}
          step={1}
          className="w-full"
          style={sliderStyle}
        />
      </div>

      {/* Available only switch */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={showOnlyAvailable}
          onCheckedChange={setShowOnlyAvailable}
          style={{
            '--switch-bg': showOnlyAvailable ? themeColor : undefined,
          } as React.CSSProperties}
          className="data-[state=checked]:bg-[--switch-bg]"
        />
        <Label>{t('project.onlyAvailable')}</Label>
      </div>
    </div>
  );
};
