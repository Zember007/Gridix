
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Filter, X } from 'lucide-react';
import { Apartment } from '@/types/apartment';

export interface ApartmentFilters {
  rooms: number[];
  status: string[];
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
    setLocalFilters(filters);
  }, [filters]);

  const uniqueRooms = [...new Set(apartments.map(apt => apt.rooms))].sort((a, b) => a - b);
  const uniqueFloors = [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);
  const statuses = ['available', 'reserved', 'sold'];

  const handleRoomToggle = (room: number) => {
    const newRooms = localFilters.rooms.includes(room)
      ? localFilters.rooms.filter(r => r !== room)
      : [...localFilters.rooms, room];
    
    setLocalFilters({ ...localFilters, rooms: newRooms });
  };

  const handleStatusToggle = (status: string) => {
    const newStatus = localFilters.status.includes(status)
      ? localFilters.status.filter(s => s !== status)
      : [...localFilters.status, status];
    
    setLocalFilters({ ...localFilters, status: newStatus });
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
      status: [],
      priceRange: prices.length > 0 ? [Math.min(...prices), Math.max(...prices)] : [0, 0],
      areaRange: [Math.min(...areas), Math.max(...areas)],
      floor: []
    };
    
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Доступно';
      case 'reserved': return 'Забронировано';
      case 'sold': return 'Продано';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Фильтры</h3>
        <Button variant="outline" size="sm" onClick={resetFilters}>
          <X className="h-4 w-4 mr-1" />
          Сбросить
        </Button>
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

      {/* Статус */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Статус</Label>
        <div className="space-y-2">
          {statuses.map(status => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={status}
                checked={localFilters.status.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <Label htmlFor={status} className="text-sm">
                {getStatusText(status)}
              </Label>
            </div>
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
      {localFilters.priceRange[1] > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Цена: {localFilters.priceRange[0].toLocaleString()} - {localFilters.priceRange[1].toLocaleString()} ₽
          </Label>
          <Slider
            value={localFilters.priceRange}
            onValueChange={handlePriceRangeChange}
            min={Math.min(...apartments.map(apt => apt.price || 0).filter(p => p > 0))}
            max={Math.max(...apartments.map(apt => apt.price || 0).filter(p => p > 0))}
            step={10000}
            className="w-full"
          />
        </div>
      )}

      {/* Площадь */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Площадь: {localFilters.areaRange[0]} - {localFilters.areaRange[1]} м²
        </Label>
        <Slider
          value={localFilters.areaRange}
          onValueChange={handleAreaRangeChange}
          min={Math.min(...apartments.map(apt => apt.area))}
          max={Math.max(...apartments.map(apt => apt.area))}
          step={1}
          className="w-full"
        />
      </div>

      <Button onClick={applyFilters} className="w-full">
        <Filter className="h-4 w-4 mr-2" />
        Применить фильтры
      </Button>
    </div>
  );
};

export default ApartmentFilters;
