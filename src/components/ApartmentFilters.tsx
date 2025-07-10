
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import { Apartment } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';

interface ApartmentFiltersProps {
  apartments: Apartment[];
  onFiltersChange: (filters: ApartmentFilters) => void;
}

export interface ApartmentFilters {
  status: string;
  rooms: string;
  minPrice: number | null;
  maxPrice: number | null;
  minArea: number | null;
  maxArea: number | null;
  floor: string;
}

const ApartmentFilters = ({ apartments, onFiltersChange }: ApartmentFiltersProps) => {
  const { t } = useLanguage();
  const [filters, setFilters] = useState<ApartmentFilters>({
    status: '',
    rooms: '',
    minPrice: null,
    maxPrice: null,
    minArea: null,
    maxArea: null,
    floor: ''
  });

  const handleFilterChange = (key: keyof ApartmentFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: ApartmentFilters = {
      status: '',
      rooms: '',
      minPrice: null,
      maxPrice: null,
      minArea: null,
      maxArea: null,
      floor: ''
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  // Получаем уникальные значения для фильтров
  const uniqueRooms = [...new Set(apartments.map(apt => apt.rooms))].sort((a, b) => a - b);
  const uniqueFloors = [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('filters.title')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            {t('filters.clear')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="status">{t('apartment.status')}</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('filters.allStatuses')}</SelectItem>
              <SelectItem value="available">{t('apartment.statusAvailable')}</SelectItem>
              <SelectItem value="reserved">{t('apartment.statusReserved')}</SelectItem>
              <SelectItem value="sold">{t('apartment.statusSold')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="rooms">{t('apartment.rooms')}</Label>
          <Select value={filters.rooms} onValueChange={(value) => handleFilterChange('rooms', value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.allRooms')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('filters.allRooms')}</SelectItem>
              {uniqueRooms.map(rooms => (
                <SelectItem key={rooms} value={rooms.toString()}>
                  {rooms === 0 ? t('apartment.studio') : `${rooms} ${t('apartment.room')}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="floor">{t('apartment.floor')}</Label>
          <Select value={filters.floor} onValueChange={(value) => handleFilterChange('floor', value)}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.allFloors')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('filters.allFloors')}</SelectItem>
              {uniqueFloors.map(floor => (
                <SelectItem key={floor} value={floor.toString()}>
                  {floor} {t('apartment.floorSuffix')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="minPrice">{t('filters.priceFrom')}</Label>
          <Input
            id="minPrice"
            type="number"
            placeholder="0"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div>
          <Label htmlFor="maxPrice">{t('filters.priceTo')}</Label>
          <Input
            id="maxPrice"
            type="number"
            placeholder="∞"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div>
          <Label htmlFor="minArea">{t('filters.areaFrom')}</Label>
          <Input
            id="minArea"
            type="number"
            placeholder="0"
            value={filters.minArea || ''}
            onChange={(e) => handleFilterChange('minArea', e.target.value ? Number(e.target.value) : null)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ApartmentFilters;
