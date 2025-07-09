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
import { useLanguage } from '@/contexts/LanguageContext';
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
  embedMode?: boolean;
}

const ProjectApartmentSelector = ({ projectId, embedMode = false }: ProjectApartmentSelectorProps) => {
  const { t } = useLanguage();
  
  const [project, setProject] = useState<Project | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedRooms, setSelectedRooms] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
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

    if (selectedFloor !== 'all') {
      filtered = filtered.filter(apt => apt.floor_number === parseInt(selectedFloor));
    }

    if (selectedRooms !== 'all') {
      filtered = filtered.filter(apt => apt.rooms === parseInt(selectedRooms));
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter(apt => apt.status === 'available');
    }

    filtered = filtered.filter(apt => {
      const price = apt.price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

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
          <p className="text-muted-foreground">{t('project.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background ${embedMode ? '' : 'container mx-auto px-4 py-8'}`}>
      {/* Header with filters */}
      <div className={`border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${embedMode ? '' : 'sticky top-0'} z-50`}>
        <div className={`${embedMode ? 'px-4' : 'container mx-auto px-4'} py-6`}>
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
              <Label htmlFor="floor-select">{t('project.floor')}</Label>
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger id="floor-select">
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

            {/* Rooms filter */}
            <div className="space-y-2">
              <Label htmlFor="rooms-select">{t('project.rooms')}</Label>
              <Select value={selectedRooms} onValueChange={setSelectedRooms}>
                <SelectTrigger id="rooms-select">
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

            {/* Status filter */}
            <div className="space-y-2">
              <Label htmlFor="status-select">{t('project.status')}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-select">
                  <SelectValue placeholder={t('project.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('project.allStatuses')}</SelectItem>
                  <SelectItem value="available">{t('common.available')}</SelectItem>
                  <SelectItem value="reserved">{t('common.reserved')}</SelectItem>
                  <SelectItem value="sold">{t('common.sold')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search-input">{t('common.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder={t('project.apartmentNumber')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-2 md:col-span-2">
              <Label>{t('project.price')}: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} ₽</Label>
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
                <Label htmlFor="available-only">{t('project.onlyAvailable')}</Label>
              </div>
            </div>

            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'floor-plan' | 'table')}>
              <TabsList>
                <TabsTrigger value="floor-plan">{t('project.floorPlan')}</TabsTrigger>
                <TabsTrigger value="table">{t('project.table')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`${embedMode ? 'px-4' : 'container mx-auto px-4'} py-8`}>
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
                  {t('project.summary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{getAvailableCount()}</div>
                    <div className="text-sm text-muted-foreground">{t('common.available')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{filteredApartments.length}</div>
                    <div className="text-sm text-muted-foreground">{t('project.total')}</div>
                  </div>
                </div>
                
                {getAveragePrice() > 0 && (
                  <div className="text-center pt-2 border-t">
                    <div className="text-lg font-semibold text-foreground">
                      {formatPrice(getAveragePrice())} ₽
                    </div>
                    <div className="text-sm text-muted-foreground">{t('project.averagePrice')}</div>
                  </div>
                )}

                <Button className="w-full" size="lg">
                  {t('project.contactManager')}
                </Button>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>{t('project.legend')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">{t('common.available')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">{t('common.reserved')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-sm">{t('common.sold')}</span>
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
                      {t('apartment.number')} {selectedApartment.apartment_number}
                    </span>
                    <Badge variant={
                      selectedApartment.status === 'available' ? 'default' :
                      selectedApartment.status === 'reserved' ? 'secondary' : 'destructive'
                    }>
                      {selectedApartment.status === 'available' ? t('common.available') :
                       selectedApartment.status === 'reserved' ? t('common.reserved') : t('common.sold')}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApartment.floor_number} {t('apartment.floor').toLowerCase()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApartment.rooms === 0 ? t('apartment.studio') : `${selectedApartment.rooms} ${t('apartment.room')}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedApartment.area} {t('apartment.sqm')}</span>
                    </div>
                    {selectedApartment.price && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>{Math.round((selectedApartment.price) / selectedApartment.area).toLocaleString()} {t('apartment.pricePerSqm')}</span>
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
                    {selectedApartment.status === 'available' ? t('common.reserve') : t('common.unavailable')}
                  </Button>
                  
                  <Button variant="outline" className="w-full">
                    {t('common.more')}
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
