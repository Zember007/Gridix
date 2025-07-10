
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Filter, X } from 'lucide-react';
import { Apartment } from '@/types/apartment';

export interface ApartmentFilters {
  rooms: number[];
  onlyAvailable: boolean;
  priceRange: [number, number];
  areaRange: [number, number];
  floor: number[];
}

interface ApartmentFiltersProps {
  apartments: Apartment[];
  filters: ApartmentFilters;
  onFiltersChange: (filters: ApartmentFilters) => void;
}

const ApartmentFilters = ({ apartments, filters, onFiltersChange }: ApartmentFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<ApartmentFilters>(filters);

  useEffect(() => {
    // Инициализируем фильтры с полными диапазонами цен и площади
    const prices = apartments.map(apt => apt.price || 0).filter(p => p > 0);
    const areas = apartments.map(apt => apt.area);
    
    const defaultFilters: ApartmentFilters = {
      rooms: [],
      onlyAvailable: true, // по умолчанию включен
      priceRange: prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 0],
      areaRange: [Math.min(...areas), Math.max(...areas)],
      floor: []
    };
    
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  }, [apartments]);

  const uniqueRooms = [...new Set(apartments.map(apt => apt.rooms))].sort((a, b) => a - b);
  const uniqueFloors = [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);

  const handleRoomToggle = (room: number) => {
    const newRooms = localFilters.rooms.includes(room)
      ? localFilters.rooms.filter(r => r !== room)
      : [...localFilters.rooms, room];
    
    setLocalFilters({ ...localFilters, rooms: newRooms });
  };

  const handleFloorToggle = (floor: number) => {
    const newFloors = localFilters.floor.includes(floor)
      ? localFilters.floor.filter(f => f !== floor)
      : [...localFilters.floor, floor];
    
    setLocalFilters({ ...localFilters, floor: newFloors });
  };

  const handlePriceRangeChange = (range: number[]) => {
    setLocalFilters({ ...localFilters, priceRange: [range[0], range[1]] });
  };

  const handleAreaRangeChange = (range: number[]) => {
    setLocalFilters({ ...localFilters, areaRange: [range[0], range[1]] });
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const resetFilters = () => {
    const prices = apartments.map(apt => apt.price || 0).filter(p => p > 0);
    const areas = apartments.map(apt => apt.area);
    
    const defaultFilters: ApartmentFilters = {
      rooms: [],
      onlyAvailable: true,
      priceRange: prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 0],
      areaRange: [Math.min(...areas), Math.max(...areas)],
      floor: []
    };
    
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const minPrice = Math.min(...apartments.map(apt => apt.price || 0).filter(p => p > 0));
  const maxPrice = Math.max(...apartments.map(apt => apt.price || 0).filter(p => p > 0));
  const minArea = Math.min(...apartments.map(apt => apt.area));
  const maxArea = Math.max(...apartments.map(apt => apt.area));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Фильтры</h3>
        <Button variant="outline" size="sm" onClick={resetFilters}>
          <X className="h-4 w-4 mr-1" />
          Сбросить
        </Button>
      </div>

      {/* Только доступные */}
      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="onlyAvailable"
            checked={localFilters.onlyAvailable}
            onCheckedChange={(checked) => 
              setLocalFilters({ ...localFilters, onlyAvailable: !!checked })
            }
          />
          <Label htmlFor="onlyAvailable" className="text-sm">
            Только доступные квартиры
          </Label>
        </div>
      </div>

      {/* Комнаты */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Количество комнат</Label>
        <div className="flex flex-wrap gap-2">
          {uniqueRooms.map(room => (
            <Button
              key={room}
              variant={localFilters.rooms.includes(room) ? "default" : "outline"}
              size="sm"
              onClick={() => handleRoomToggle(room)}
            >
              {room}
            </Button>
          ))}
        </div>
      </div>

      {/* Этажи */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Этаж</Label>
        <div className="flex flex-wrap gap-2">
          {uniqueFloors.map(floor => (
            <Button
              key={floor}
              variant={localFilters.floor.includes(floor) ? "default" : "outline"}
              size="sm"
              onClick={() => handleFloorToggle(floor)}
            >
              {floor}
            </Button>
          ))}
        </div>
      </div>

      {/* Цена */}
      {maxPrice > 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Цена: {localFilters.priceRange[0].toLocaleString()} - {localFilters.priceRange[1].toLocaleString()} ₽
          </Label>
          <div className="px-2">
            <Slider
              value={localFilters.priceRange}
              onValueChange={handlePriceRangeChange}
              min={minPrice}
              max={maxPrice}
              step={10000}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Площадь */}
      <div>
        <Label className="text-sm font-medium mb-3 block">
          Площадь: {localFilters.areaRange[0]} - {localFilters.areaRange[1]} м²
        </Label>
        <div className="px-2">
          <Slider
            value={localFilters.areaRange}
            onValueChange={handleAreaRangeChange}
            min={minArea}
            max={maxArea}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <Button onClick={applyFilters} className="w-full">
        <Filter className="h-4 w-4 mr-2" />
        Применить фильтры
      </Button>
    </div>
  );
};

export default ApartmentFilters;
