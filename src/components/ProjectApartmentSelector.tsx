
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Building2, Home, MapPin, Ruler, DollarSign } from 'lucide-react';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import ApartmentFloorPlan from './ApartmentFloorPlan';
import ApartmentTable from './ApartmentTable';
import ApartmentDetailsModal from './ApartmentDetailsModal';

interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  floors: number;
  building_image_url: string | null;
}

interface ProjectApartmentSelectorProps {
  projectId: string;
}

const ProjectApartmentSelector = ({ projectId }: ProjectApartmentSelectorProps) => {
  const [project, setProject] = useState<Project | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedRooms, setSelectedRooms] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  
  // View mode
  const [viewMode, setViewMode] = useState<'floor-plan' | 'table'>('floor-plan');

  useEffect(() => {
    loadProject();
    loadApartments();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [apartments, selectedFloor, selectedRooms, selectedStatus, priceRange, searchQuery, showOnlyAvailable]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadApartments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('apartments')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      
      const normalizedApartments = (data || []).map(normalizeApartmentData);
      setApartments(normalizedApartments);
      
      // Set initial price range based on data
      if (normalizedApartments.length > 0) {
        const prices = normalizedApartments
          .map(apt => apt.price || 0)
          .filter(price => price > 0);
        
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([minPrice, maxPrice]);
        }
      }
    } catch (error) {
      console.error('Error loading apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = apartments;

    // Floor filter
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(apt => apt.floor_number === parseInt(selectedFloor));
    }

    // Rooms filter
    if (selectedRooms !== 'all') {
      filtered = filtered.filter(apt => apt.rooms === parseInt(selectedRooms));
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    // Only available filter
    if (showOnlyAvailable) {
      filtered = filtered.filter(apt => apt.status === 'available');
    }

    // Price range filter
    filtered = filtered.filter(apt => {
      const price = apt.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.apartment_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredApartments(filtered);
  };

  const getUniqueFloors = () => {
    return [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);
  };

  const getUniqueRoomCounts = () => {
    return [...new Set(apartments.map(apt => apt.rooms))].sort((a, b) => a - b);
  };

  const getAvailableCount = () => {
    return filteredApartments.filter(apt => apt.status === 'available').length;
  };

  const getAveragePrice = () => {
    const availableApartments = filteredApartments.filter(apt => apt.status === 'available' && apt.price);
    if (availableApartments.length === 0) return 0;
    
    const total = availableApartments.reduce((sum, apt) => sum + (apt.price || 0), 0);
    return Math.round(total / availableApartments.length);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Загрузка проекта...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with filters */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">{project.name}</h1>
            {project.address && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{project.address}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
            {/* Floor filter */}
            <div className="space-y-2">
              <Label htmlFor="floor-select">Этаж</Label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger id="floor-select">
                  <SelectValue placeholder="Все этажи" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все этажи</SelectItem>
                  {getUniqueFloors().map(floor => (
                    <SelectItem key={floor} value={floor.toString()}>
                      {floor} этаж
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rooms filter */}
            <div className="space-y-2">
              <Label htmlFor="rooms-select">Комнаты</Label>
              <Select value={selectedRooms} onValueChange={setSelectedRooms}>
                <SelectTrigger id="rooms-select">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  {getUniqueRoomCounts().map(rooms => (
                    <SelectItem key={rooms} value={rooms.toString()}>
                      {rooms === 0 ? 'Студия' : `${rooms} комн.`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status filter */}
            <div className="space-y-2">
              <Label htmlFor="status-select">Статус</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-select">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="available">Доступно</SelectItem>
                  <SelectItem value="reserved">Забронировано</SelectItem>
                  <SelectItem value="sold">Продано</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search-input">Поиск</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="Номер квартиры"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-2 md:col-span-2">
              <Label>Цена: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} ₽</Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={10000000}
                min={0}
                step={100000}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="available-only"
                  checked={showOnlyAvailable}
                  onCheckedChange={setShowOnlyAvailable}
                />
                <Label htmlFor="available-only">Только доступные</Label>
              </div>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'floor-plan' | 'table')}>
              <TabsList>
                <TabsTrigger value="floor-plan">План этажа</TabsTrigger>
                <TabsTrigger value="table">Таблица</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Floor plan / Table */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {viewMode === 'floor-plan' ? (
                  <ApartmentFloorPlan
                    projectId={projectId}
                    project={project}
                    apartments={filteredApartments}
                    onApartmentSelect={setSelectedApartment}
                  />
                ) : (
                  <ApartmentTable
                    apartments={filteredApartments}
                    onApartmentSelect={setSelectedApartment}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with summary */}
          <div className="space-y-6">
            {/* Summary card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Сводка
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{getAvailableCount()}</div>
                    <div className="text-sm text-muted-foreground">Доступно</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{filteredApartments.length}</div>
                    <div className="text-sm text-muted-foreground">Всего</div>
                  </div>
                </div>
                
                {getAveragePrice() > 0 && (
                  <div className="text-center pt-2 border-t">
                    <div className="text-lg font-semibold text-foreground">
                      {formatPrice(getAveragePrice())} ₽
                    </div>
                    <div className="text-sm text-muted-foreground">Средняя цена</div>
                  </div>
                )}

                <Button className="w-full" size="lg">
                  Связаться с менеджером
                </Button>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Легенда</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Доступно</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Забронировано</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-sm">Продано</span>
                </div>
              </CardContent>
            </Card>

            {/* Selected apartment info */}
            {selectedApartment && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Квартира {selectedApartment.apartment_number}
                    </span>
                    <Badge variant={
                      selectedApartment.status === 'available' ? 'default' :
                      selectedApartment.status === 'reserved' ? 'secondary' : 'destructive'
                    }>
                      {selectedApartment.status === 'available' ? 'Доступно' :
                       selectedApartment.status === 'reserved' ? 'Забронировано' : 'Продано'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApartment.floor_number} этаж</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApartment.rooms === 0 ? 'Студия' : `${selectedApartment.rooms} комн.`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApartment.area} м²</span>
                    </div>
                    {selectedApartment.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{Math.round((selectedApartment.price) / selectedApartment.area).toLocaleString()} ₽/м²</span>
                      </div>
                    )}
                  </div>

                  {selectedApartment.price && (
                    <div className="pt-4 border-t">
                      <div className="text-2xl font-bold text-primary text-center">
                        {formatPrice(selectedApartment.price)} ₽
                      </div>
                    </div>
                  )}

                  <Button className="w-full" disabled={selectedApartment.status !== 'available'}>
                    {selectedApartment.status === 'available' ? 'Забронировать' : 'Недоступно'}
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    Подробнее
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Apartment details modal */}
      {selectedApartment && (
        <ApartmentDetailsModal
          apartment={selectedApartment}
          open={!!selectedApartment}
          onClose={() => setSelectedApartment(null)}
        />
      )}
    </div>
  );
};

export default ProjectApartmentSelector;
