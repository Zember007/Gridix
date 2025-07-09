
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { X } from 'lucide-react';
import { Apartment } from '@/types/apartment';

interface FilterState {
  rooms: number[];
  status: string[];
  priceRange: [number, number];
  areaRange: [number, number];
  floor: number[];
}

interface ApartmentFiltersProps {
  apartments: Apartment[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const ApartmentFilters = ({ apartments, filters, onFiltersChange }: ApartmentFiltersProps) => {
  const [tempPriceRange, setTempPriceRange] = useState(filters.priceRange);
  const [tempAreaRange, setTempAreaRange] = useState(filters.areaRange);

  const availableRooms = Array.from(new Set(apartments.map(apt => apt.rooms))).sort();
  const availableFloors = Array.from(new Set(apartments.map(apt => apt.floor_number))).sort();
  const statusOptions = [
    { value: 'available', label: 'Доступно', color: 'bg-green-100 text-green-800' },
    { value: 'reserved', label: 'Забронировано', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sold', label: 'Продано', color: 'bg-red-100 text-red-800' }
  ];

  const prices = apartments.map(apt => apt.price || 0).filter(p => p > 0);
  const areas = apartments.map(apt => apt.area);
  
  const priceMin = prices.length > 0 ? Math.min(...prices) : 0;
  const priceMax = prices.length > 0 ? Math.max(...prices) : 0;
  const areaMin = Math.min(...areas);
  const areaMax = Math.max(...areas);

  const toggleRoom = (room: number) => {
    const newRooms = filters.rooms.includes(room)
      ? filters.rooms.filter(r => r !== room)
      : [...filters.rooms, room];
    onFiltersChange({ ...filters, rooms: newRooms });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const toggleFloor = (floor: number) => {
    const newFloors = filters.floor.includes(floor)
      ? filters.floor.filter(f => f !== floor)
      : [...filters.floor, floor];
    onFiltersChange({ ...filters, floor: newFloors });
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      rooms: [],
      status: [],
      priceRange: [priceMin, priceMax],
      areaRange: [areaMin, areaMax],
      floor: []
    };
    onFiltersChange(clearedFilters);
    setTempPriceRange([priceMin, priceMax]);
    setTempAreaRange([areaMin, areaMax]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const hasActiveFilters = filters.rooms.length > 0 || filters.status.length > 0 || filters.floor.length > 0;

  return (
    <div className="space-y-6">
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Активные фильтры</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-3 w-3 mr-1" />
            Очистить все
          </Button>
        </div>
      )}

      {/* Количество комнат */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Количество комнат</Label>
        <div className="flex flex-wrap gap-2">
          {availableRooms.map(room => (
            <Button
              key={room}
              variant={filters.rooms.includes(room) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleRoom(room)}
              className="text-sm"
            >
              {room === 0 ? 'Студия' : `${room} комн.`}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Статус */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Статус</Label>
        <div className="space-y-2">
          {statusOptions.map(option => (
            <div key={option.value} className="flex items-center gap-2">
              <Button
                variant={filters.status.includes(option.value) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleStatus(option.value)}
                className="flex-1 justify-start text-sm"
              >
                {option.label}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Этаж */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Этаж</Label>
        <div className="grid grid-cols-4 gap-2">
          {availableFloors.map(floor => (
            <Button
              key={floor}
              variant={filters.floor.includes(floor) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFloor(floor)}
              className="text-sm"
            >
              {floor}
            </Button>
          ))}
        </div>
      </div>

      {prices.length > 0 && (
        <>
          <Separator />
          
          {/* Цена */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Цена: {formatPrice(tempPriceRange[0])} - {formatPrice(tempPriceRange[1])} ₽
            </Label>
            <Slider
              value={tempPriceRange}
              onValueChange={(value) => setTempPriceRange(value as [number, number])}
              onValueCommit={(value) => onFiltersChange({ ...filters, priceRange: value as [number, number] })}
              min={priceMin}
              max={priceMax}
              step={Math.max(1, Math.round((priceMax - priceMin) / 100))}
              className="w-full"
            />
          </div>
        </>
      )}

      <Separator />

      {/* Площадь */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Площадь: {tempAreaRange[0]} - {tempAreaRange[1]} м²
        </Label>
        <Slider
          value={tempAreaRange}
          onValueChange={(value) => setTempAreaRange(value as [number, number])}
          onValueCommit={(value) => onFiltersChange({ ...filters, areaRange: value as [number, number] })}
          min={areaMin}
          max={areaMax}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ApartmentFilters;
