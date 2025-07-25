import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, Building2, Home, MapPin, Ruler, DollarSign, SlidersHorizontal, Calendar, Eye, List, Grid, Share, Heart, Maximize2, X } from 'lucide-react';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import ApartmentFloorPlan from './ApartmentFloorPlan';
import BuildingFacadeView from './BuildingFacadeView';
import ApartmentDetailsModal from './ApartmentDetailsModal';
import ApartmentPhotosViewer from './ApartmentPhotosViewer';

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
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [areaRange, setAreaRange] = useState<number[]>([0, 200]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [viewMode, setViewMode] = useState<'facade' | 'floor-plan' | 'list'>('facade');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFloorForPlan, setSelectedFloorForPlan] = useState<number>(1);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProject();
    loadApartments();
  }, [projectId]);

  useEffect(() => {
    applyFilters();
  }, [apartments, selectedFloor, selectedRooms, priceRange, areaRange, searchQuery, showOnlyAvailable]);

  useEffect(() => {
    // Set default floor when apartments load
    if (apartments.length > 0 && selectedFloorForPlan === 1) {
      const uniqueFloors = getUniqueFloors();
      if (uniqueFloors.length > 0) {
        setSelectedFloorForPlan(uniqueFloors[0]);
      }
    }
  }, [apartments]);

  useEffect(() => {
    setSelectedApartment(null);
  }, [viewMode]);

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
        
        const areas = normalizedApartments.map(apt => apt.area);
        
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([minPrice, maxPrice]);
        }
        
        if (areas.length > 0) {
          const minArea = Math.min(...areas);
          const maxArea = Math.max(...areas);
          setAreaRange([minArea, maxArea]);
        }
      }
    } catch (error) {
      console.error('Error loading apartments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...apartments];

    if (selectedFloor !== 'all') {
      filtered = filtered.filter(apt => apt.floor_number === parseInt(selectedFloor));
    }

    if (selectedRooms !== 'all') {
      if (selectedRooms === '4+') {
        filtered = filtered.filter(apt => apt.rooms >= 4);
      } else {
        filtered = filtered.filter(apt => apt.rooms === parseInt(selectedRooms));
      }
    }

    if (showOnlyAvailable) {
      filtered = filtered.filter(apt => apt.status === 'available');
    }

    filtered = filtered.filter(apt => {
      const price = apt.price || 0;
      const area = apt.area || 0;
      return price >= priceRange[0] && price <= priceRange[1] &&
             area >= areaRange[0] && area <= areaRange[1];
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  const minPrice = apartments.length > 0 ? Math.min(...apartments.map(apt => apt.price || 0).filter(p => p > 0)) : 0;
  const maxPrice = apartments.length > 0 ? Math.max(...apartments.map(apt => apt.price || 0).filter(p => p > 0)) : 10000000;
  const minArea = apartments.length > 0 ? Math.min(...apartments.map(apt => apt.area)) : 0;
  const maxArea = apartments.length > 0 ? Math.max(...apartments.map(apt => apt.area)) : 200;

  if (loading || !project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">{t('project.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top filters bar - always visible */}
      <div ref={filtersRef} className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          {/* View mode buttons */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'facade' ? 'default' : 'outline'} 
                size="sm" 
                className={viewMode === 'facade' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                onClick={() => setViewMode('facade')}
              >
                <Building2 className="h-4 w-4 mr-1" />
                {t('project.facade')}
              </Button>
              <Button 
                variant={viewMode === 'floor-plan' ? 'default' : 'outline'} 
                size="sm"
                className={viewMode === 'floor-plan' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                onClick={() => setViewMode('floor-plan')}
              >
                <Grid className="h-4 w-4 mr-1" />
                {t('project.floorPlan')}
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="sm"
                className={viewMode === 'list' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-1" />
                {t('project.listView')}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Rooms filter */}
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

            {/* Floor filter (only for facade and list views) */}
            {viewMode !== 'floor-plan' && (
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

            {/* Price range */}
            <div className="space-y-2">
              <Label>{t('project.price')}: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])} ₽</Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={maxPrice}
                min={minPrice}
                step={100000}
                className="w-full"
              />
            </div>

            {/* Available only switch */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={showOnlyAvailable}
                onCheckedChange={setShowOnlyAvailable}
              />
              <Label>{t('project.onlyAvailable')}</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        // List view - full screen list without hero section
        <div className="container mx-auto px-6 py-8">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">{t('project.apartmentsList')}</h2>
            <div className="space-y-4">
              {/* Table header */}
              <div className="grid grid-cols-7 gap-4 py-3 text-sm text-gray-500 border-b">
                <div>{t('project.layout')}</div>
                <div>{t('project.type')}</div>
                <div>{t('project.area')}</div>
                <div>{t('project.location')}</div>
                <div>{t('project.floor')}</div>
                <div>{t('project.price')}</div>
                <div>{t('project.finishing')}</div>
              </div>
              
              {/* Apartment rows */}
              {filteredApartments.map((apartment) => (
                <div key={apartment.id} className="grid grid-cols-7 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApartment(apartment)}>
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">{apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}</span>
                  </div>
                  <div className="flex items-center">
                    <span>{apartment.area} м²</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600">{t('project.sampleLocation')}</span>
                  </div>
                  <div className="flex items-center">
                    <span>{apartment.floor_number} {t('project.of')} {project.floors}</span>
                  </div>
                  <div className="flex items-center">
                    <div>
                      <div className="font-bold text-lg">{apartment.price ? `${formatPrice(apartment.price)} ₽` : t('project.onRequest')}</div>
                      <div className="text-sm text-gray-500">{t('project.installmentFrom')}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-600">{t('project.blackFrame')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Facade and Floor Plan views with hero section
        <>
          {/* Main visualization area */}
          <div className="relative">
            {/* Hero section with building visualization */}
            <div className="relative bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 overflow-hidden">
              {viewMode === 'facade' ? (
                // Building facade view with interactive floor polygons
                <div className="w-full bg-white">
                  <BuildingFacadeView
                    projectId={projectId}
                    project={project}
                    apartments={filteredApartments}
                    onFloorSelect={(floor) => {
                      setSelectedFloorForPlan(floor);
                      setViewMode('floor-plan');
                    }}
                    onApartmentSelect={setSelectedApartment}
                    filtersRef={filtersRef}
                  />
                  
                  {/* Layout gallery below facade when not expanded */}
                  <div className="container mx-auto px-6 py-8">
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900">{t('project.layouts')}</h3>
                      
                      {/* Layout type filters */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        <Button
                          variant={selectedRooms === 'all' ? 'default' : 'outline'}
                          size="sm"
                          className={selectedRooms === 'all' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                          onClick={() => setSelectedRooms('all')}
                        >
                          {t('project.allTypes')}
                        </Button>
                        <Button
                          variant={selectedRooms === '0' ? 'default' : 'outline'}
                          size="sm"
                          className={selectedRooms === '0' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                          onClick={() => setSelectedRooms('0')}
                        >
                          {t('apartment.studio')}
                        </Button>
                        {getUniqueRoomCounts().filter(rooms => rooms > 0).map(rooms => (
                          <Button
                            key={rooms}
                            variant={selectedRooms === rooms.toString() ? 'default' : 'outline'}
                            size="sm"
                            className={selectedRooms === rooms.toString() ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                            onClick={() => setSelectedRooms(rooms.toString())}
                          >
                            {rooms}
                          </Button>
                        ))}
                        <Button
                          variant={selectedRooms === '4+' ? 'default' : 'outline'}
                          size="sm"
                          className={selectedRooms === '4+' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                          onClick={() => {
                            // Handle 4+ rooms filter
                            const fourPlusApartments = apartments.filter(apt => apt.rooms >= 4);
                            if (fourPlusApartments.length > 0) {
                              setSelectedRooms('4+');
                            }
                          }}
                        >
                          4+
                        </Button>
                      </div>
                      
                      {/* Layout cards grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {(() => {
                          // Group apartments by type (rooms + area)
                          const layoutGroups: { [key: string]: Apartment[] } = {};
                          
                          let apartmentsToShow = apartments;
                          if (selectedRooms !== 'all') {
                            if (selectedRooms === '4+') {
                              apartmentsToShow = apartments.filter(apt => apt.rooms >= 4);
                            } else {
                              apartmentsToShow = apartments.filter(apt => apt.rooms === parseInt(selectedRooms));
                            }
                          }
                          
                          apartmentsToShow.forEach(apt => {
                            const key = `${apt.rooms}-rooms`;
                            if (!layoutGroups[key]) {
                              layoutGroups[key] = [];
                            }
                            layoutGroups[key].push(apt);
                          });
                          
                          return Object.entries(layoutGroups).map(([key, apartmentGroup]) => {
                            const representativeApt = apartmentGroup[0];
                            const availableCount = apartmentGroup.filter(apt => apt.status === 'available').length;
                            const totalCount = apartmentGroup.length;
                            
                            return (
                              <Card key={key} className="overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="aspect-[4/3] bg-gray-100 relative">
                                  <ApartmentPhotosViewer apartmentId={representativeApt.id} />
                                  
                                  {/* Status badge */}
                                  <div className="absolute top-2 right-2 z-10">
                                    <Badge 
                                      variant={availableCount > 0 ? 'default' : 'secondary'}
                                      className={availableCount > 0 ? 'bg-green-500' : 'bg-gray-500'}
                                    >
                                      {availableCount > 0 ? `${availableCount} ${t('common.available')}` : t('common.unavailable')}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-lg">
                                      {representativeApt.rooms === 0 ? t('apartment.studio') : `${representativeApt.rooms}-${t('apartment.rooms')}`}
                                    </h4>
                                    
                                    <div className="text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <Ruler className="h-4 w-4" />
                                        {(() => {
                                          const areas = apartmentGroup.map(apt => apt.area);
                                          const minArea = Math.min(...areas);
                                          const maxArea = Math.max(...areas);
                                          return minArea === maxArea ? `${minArea} м²` : `${minArea}-${maxArea} м²`;
                                        })()}
                                      </span>
                                    </div>
                                    
                                    {/* Price range */}
                                    {(() => {
                                      const prices = apartmentGroup.map(apt => apt.price).filter(p => p);
                                      if (prices.length > 0) {
                                        const minPrice = Math.min(...prices);
                                        const maxPrice = Math.max(...prices);
                                        return (
                                          <div className="font-bold text-lg">
                                            {minPrice === maxPrice 
                                              ? `${formatPrice(minPrice)} ₽`
                                              : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)} ₽`
                                            }
                                          </div>
                                        );
                                      }
                                      return <div className="font-bold text-lg">{t('project.onRequest')}</div>;
                                    })()}
                                    
                                    <Button 
                                      className="w-full bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white"
                                      onClick={() => {
                                        // Set filters and switch to list view
                                        setSelectedRooms(representativeApt.rooms >= 4 ? '4+' : representativeApt.rooms.toString());
                                        setViewMode('list');
                                      }}
                                    >
                                      Смотреть {totalCount} {totalCount === 1 ? 'вариант' : 'вариантов'}
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          });
                        })()}
                      </div>
                      
                      {apartments.length === 0 && (
                        <div className="text-center py-12">
                          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">{t('project.noApartments')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Floor plan view for specific floor
                <div className="w-full h-full bg-white">
                  <ApartmentFloorPlan
                    projectId={projectId}
                    project={project}
                    apartments={filteredApartments.filter(apt => 
                      selectedFloorForPlan ? apt.floor_number === selectedFloorForPlan : true
                    )}
                    onApartmentSelect={setSelectedApartment}
                  />
                </div>
              )}

              {/* Expand button */}
              <Button
                className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full p-3"
                onClick={() => setIsFullscreen(true)}
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Floor selector for floor-plan mode */}
            {viewMode === 'floor-plan' && (
              <div className="bg-white border-b py-4">
                <div className="container mx-auto px-6">
                  <div className="flex items-center justify-center gap-2">
                    <Label className="text-sm font-medium">{t('project.selectFloor')}:</Label>
                    <div className="flex items-center gap-2">
                      {getUniqueFloors().map(floor => (
                        <Button
                          key={floor}
                          variant={selectedFloorForPlan === floor ? 'default' : 'outline'}
                          size="sm"
                          className={selectedFloorForPlan === floor ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                          onClick={() => setSelectedFloorForPlan(floor)}
                        >
                          {floor}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Apartment summary section - only show if apartment is selected */}
          {selectedApartment && (
            <div className="bg-gray-50 border-t">
              <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Apartment Layout Images */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">{t('project.layouts')}</h3>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedApartment(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Layout type filter buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-[#1E1E1E] text-white"
                      >
                        {t('apartment.studio')}
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-300">1</Button>
                      <Button variant="outline" size="sm" className="border-gray-300">2</Button>
                      <Button variant="outline" size="sm" className="border-gray-300">3</Button>
                      <Button variant="outline" size="sm" className="border-gray-300">4+</Button>
                    </div>
                    
                                         {/* Apartment Photos Viewer */}
                     <div className="space-y-4">
                       <ApartmentPhotosViewer apartmentId={selectedApartment.id} />
                     </div>
                  </div>

                  {/* Apartment Details */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-5 w-5 text-gray-600" />
                        <span className="text-lg font-semibold">
                          {t('apartment.number')} {selectedApartment.apartment_number}
                        </span>
                      </div>
                      <p className="text-gray-600">{selectedApartment.rooms === 0 ? t('apartment.studio') : `${selectedApartment.rooms} ${t('apartment.rooms')}`}</p>
                    </div>

                    {/* Key details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">{t('project.area')}</div>
                        <div className="font-semibold text-lg">{selectedApartment.area} м²</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">{t('project.floor')}</div>
                        <div className="font-semibold text-lg">{selectedApartment.floor_number} {t('project.of')} {project.floors}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">{t('project.location')}</div>
                        <div className="font-semibold">{t('project.sampleLocation')}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-gray-500">{t('project.finishing')}</div>
                        <div className="font-semibold">{t('project.blackFrame')}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">{t('project.price')}</div>
                        <div className="font-bold text-2xl">
                          {selectedApartment.price ? `${formatPrice(selectedApartment.price)} ₽` : t('project.onRequest')}
                        </div>
                        <div className="text-sm text-gray-500">{t('project.installmentFrom')}</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white"
                        disabled={selectedApartment.status !== 'available'}
                      >
                        {selectedApartment.status === 'available' ? t('common.reserve') : t('common.unavailable')}
                      </Button>
                      <Button variant="outline" className="flex-1">
                        {t('common.more')}
                      </Button>
                    </div>

                    {/* Additional actions */}
                    <div className="flex items-center justify-center gap-4 pt-2">
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Share className="h-4 w-4" />
                        <span className="text-sm">Поделиться</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">В избранное</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <Button
            className="absolute top-4 right-4 bg-white text-black rounded-full p-2 z-10"
            onClick={() => setIsFullscreen(false)}
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="w-full h-full p-8">
            {viewMode === 'facade' ? (
              <div className="w-full h-full bg-white rounded-lg">
                <BuildingFacadeView
                  projectId={projectId}
                  project={project}
                  apartments={filteredApartments}
                  onFloorSelect={(floor) => {
                    setSelectedFloorForPlan(floor);
                    setViewMode('floor-plan');
                    setIsFullscreen(false);
                  }}
                  onApartmentSelect={setSelectedApartment}
                  filtersRef={filtersRef}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-white rounded-lg p-4">
                <ApartmentFloorPlan
                  projectId={projectId}
                  project={project}
                  apartments={filteredApartments.filter(apt => 
                    selectedFloorForPlan ? apt.floor_number === selectedFloorForPlan : true
                  )}
                  onApartmentSelect={setSelectedApartment}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ApartmentDetailsModal
        apartment={selectedApartment}
        isOpen={viewMode !== 'list' ? false : !!selectedApartment}
        onClose={() => setSelectedApartment(null)}
      />
    </div>
  );
};

export default ProjectApartmentSelector;
