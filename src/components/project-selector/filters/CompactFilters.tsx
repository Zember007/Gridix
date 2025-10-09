import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CurrencyToggle from '@/components/common/CurrencyToggle';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Project {
  has_commercial?: boolean;
  has_parking?: boolean;
  currency?: string;
  project_type?: 'building' | 'object' | null;
}

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
  getUniqueRoomCounts: () => number[];
  getUniqueFloors: () => number[];
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
  getUniqueRoomCounts,
  getUniqueFloors,
  project,
  viewMode,
  themeColor = '#000000'
}: CompactFiltersProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Rooms filter (hide for villas) */}
      {project?.project_type !== 'object' && (
      <Select value={selectedRooms} onValueChange={setSelectedRooms}>
        <SelectTrigger className="w-32">
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
      )}

      {viewMode !== 'floor-plan' && project?.project_type !== 'object' && (
        <Select value={selectedFloor} onValueChange={setSelectedFloor}>
          <SelectTrigger className="w-32">
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
      )}

      {/* Type filter - only show if project has commercial or parking */}
      {(project?.has_commercial || project?.has_parking) && (
        <Select value={selectedType} onValueChange={(value) => setSelectedType(value as 'all' | 'apartment' | 'commercial' | 'parking')}>
          <SelectTrigger className="w-32">
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
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t('project.apartmentNumber')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-48"
        />
      </div>

      {/* Currency filter */}
      <CurrencyToggle
        selectedCurrency={selectedCurrency}
        onChange={(c) => setSelectedCurrency(c)}
        projectCurrency={project?.currency}
        themeColor={themeColor}
      />

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
        <Label className="text-sm">{t('project.onlyAvailable')}</Label>
      </div>
    </div>
  );
};
