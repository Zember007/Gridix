import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProjects';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Building2, Home, MapPin, Ruler, DollarSign, SlidersHorizontal, Calendar, Eye, List, Grid, Share, Heart, Maximize2, X } from 'lucide-react';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import ApartmentFloorPlan from './ApartmentFloorPlan';
import BuildingFacadeView from './BuildingFacadeView';
import ApartmentDetailsModal from './ApartmentDetailsModal';
import ApartmentPhotosViewer from './ApartmentPhotosViewer';
import InteractiveProjectsMap from './InteractiveProjectsMap';
import { getCurrencySymbolSafe, isValidCurrency, formatPriceWithCurrency } from '@/lib/currency-utils';



interface Project {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  floors: number;
  building_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  slug: string | null;
  currency: string | null;
  min_price: number | null;
  is_public: boolean;
  is_featured: boolean;
  view_count: number;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectApartmentSelectorProps {
  projectId: string;
  embedMode?: boolean;
}

const ProjectApartmentSelector = ({ projectId, embedMode = false }: ProjectApartmentSelectorProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { project: cachedProject } = useProject(projectId);
  
  const [project, setProject] = useState<Project | null>(null);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);

  const [loading, setLoading] = useState(false);
  const [apartmentsLoaded, setApartmentsLoaded] = useState(false);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedRooms, setSelectedRooms] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [areaRange, setAreaRange] = useState<number[]>([0, 200]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');
  const [viewMode, setViewMode] = useState<'facade' | 'floor-plan' | 'list' | 'map'>('facade');
  const [selectedFloorForPlan, setSelectedFloorForPlan] = useState<number | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  // Отслеживаем, для каких этажей уже подгружены полигоны, чтобы не дёргать повторно
  const loadedPolygonsForFloorsRef = useRef<Set<number>>(new Set());
  // Кэш предзагруженных фото планировок по типу (rooms) → массив CombinedPhoto
  const [preloadedLayoutPhotosByRooms, setPreloadedLayoutPhotosByRooms] = useState<Record<string, { id: string; image_url: string; description?: string; order_index: number; type: 'layout' }[]>>({});
  // Ленивая предзагрузка: начнём только когда секция с планировками попала в видимую область

  // Загружаем проект только при изменении projectId или cachedProject
  useEffect(() => {
    if (cachedProject && !projectLoaded) {
      setProject(cachedProject);
      setProjectLoaded(true);
      // Устанавливаем валюту по умолчанию как валюту проекта, если валидна
      if (cachedProject.currency && isValidCurrency(cachedProject.currency)) {
        setSelectedCurrency(cachedProject.currency);
      }
    }
  }, [cachedProject, projectLoaded]);

  // Загрузка списка квартир (без polygon)
  const loadApartments = useCallback(async () => {
    if (apartmentsLoaded) return; // Не загружаем повторно
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('apartments')
        // Загружаем только необходимые поля без тяжёлого поля polygon
        .select('id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id')
        .eq('project_id', projectId);

      if (error) throw error;
      
      const normalizedApartments = (data || []).map(normalizeApartmentData);
      setApartments(normalizedApartments);
      setApartmentsLoaded(true);
      
      // Вычисляем диапазоны только один раз
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
  }, [projectId, apartmentsLoaded]);

  // Загружаем квартиры только когда они нужны (при первом рендере или изменении projectId)
  useEffect(() => {
    if (projectId && !apartmentsLoaded) {
      loadApartments();
    }
  }, [projectId, apartmentsLoaded, loadApartments]);



  // Уникальные этажи
  const getUniqueFloors = useCallback(() => {
    return [...new Set(apartments.map(apt => apt.floor_number))].sort((a, b) => a - b);
  }, [apartments]);

  useEffect(() => {
    // Set default floor when apartments load
    if (apartments.length > 0 && selectedFloorForPlan === null) {
      const uniqueFloors = getUniqueFloors();
      if (uniqueFloors.length > 0) {
        setSelectedFloorForPlan(uniqueFloors[0]);
      }
    }
  }, [apartments, getUniqueFloors, selectedFloorForPlan]);

  // Следим за видимостью секции планировок, чтобы отложить предзагрузку


  // Предзагрузка фото планировок одним запросом для всех типов комнат в проекте (для карточек планировок)
  useEffect(() => {
    const preloadLayoutPhotos = async () => {
      if (!projectId || apartments.length === 0) return;
      // Определяем все уникальные типы layout_type для текущего набора квартир
      const uniqueLayouts = new Set<string>(
        apartments.map(a => (a.rooms === 0 ? 'studio' : `${a.rooms}-room`))
      );

      if (uniqueLayouts.size === 0) return;

      try {
        const { data, error } = await supabase
          .from('layout_photos')
          .select('id, project_id, layout_type, image_url, description, order_index')
          .eq('project_id', projectId)
          .in('layout_type', Array.from(uniqueLayouts))
          .order('order_index', { ascending: true });

        if (error) throw error;

        const grouped: Record<string, { id: string; image_url: string; description?: string; order_index: number; type: 'layout' }[]> = {};
        (data || []).forEach(p => {
          const key = p.layout_type;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ id: p.id, image_url: p.image_url, description: p.description || undefined, order_index: p.order_index, type: 'layout' });
        });
console.log('grouped', grouped);

        setPreloadedLayoutPhotosByRooms(grouped);
      } catch (e) {
        console.error('Error preloading layout photos:', e);
      }
    };

    preloadLayoutPhotos();
  }, [projectId, apartments]);

  useEffect(() => {
    setSelectedApartment(null);
  }, [viewMode]);

  const loadProject = async () => {
    try {
      if (cachedProject) {
        setProject(cachedProject);
      }
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  // Ленивая подгрузка полигонов только для выбранного этажа при переходе в режим планов
  useEffect(() => {
    const loadPolygonsForFloor = async (floor: number) => {
      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('id, polygon')
          .eq('project_id', projectId)
          .eq('floor_number', floor);

        if (error) throw error;

        if (!data) return;

        // Обновляем только необходимые квартиры, добавляя/заменяя polygon
        setApartments(prev => prev.map(apt => {
          const found = data.find(d => d.id === apt.id);
          if (!found) return apt;
          return {
            ...apt,
            polygon: Array.isArray(found.polygon) ? found.polygon as { x: number; y: number }[] : []
          };
        }));

        loadedPolygonsForFloorsRef.current.add(floor);
      } catch (e) {
        console.error('Error loading polygons for floor:', e);
      }
    };

    if (viewMode === 'floor-plan' && selectedFloorForPlan !== null) {
      const floor = selectedFloorForPlan;
      if (!loadedPolygonsForFloorsRef.current.has(floor)) {
        loadPolygonsForFloor(floor);
      }
    }
  }, [viewMode, selectedFloorForPlan, projectId]);

  // Валюты и конвертация
  const exchangeRates = useMemo(() => ({
    RUB: 1,
    USD: 0.011,
    EUR: 0.01,
    GEL: 0.03,
  } as const), []);

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(Math.round(price));

  const convertPrice = useCallback((price: number, fromCurrency: string | null | undefined, toCurrency: string): number => {
    if (!price) return 0;
    const from = isValidCurrency(String(fromCurrency)) ? String(fromCurrency) as keyof typeof exchangeRates : 'RUB';
    const to = isValidCurrency(String(toCurrency)) ? String(toCurrency) as keyof typeof exchangeRates : 'RUB';
    const priceInRub = from === 'RUB' ? price : price / exchangeRates[from];
    return to === 'RUB' ? priceInRub : priceInRub * exchangeRates[to];
  }, [exchangeRates]);

  const filteredApartments = useMemo(() => {
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
      const convertedPrice = convertPrice(price, project?.currency, selectedCurrency);
      const area = apt.area || 0;
      return convertedPrice >= priceRange[0] && convertedPrice <= priceRange[1] &&
             area >= areaRange[0] && area <= areaRange[1];
    });

    if (searchQuery) {
      filtered = filtered.filter(apt =>
        apt.apartment_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [apartments, selectedFloor, selectedRooms, showOnlyAvailable, priceRange, areaRange, searchQuery, selectedCurrency, project?.currency, convertPrice]);

  

  const getUniqueRoomCounts = useCallback(() => {
    return [...new Set(apartments.map(apt => apt.rooms))].sort((a, b) => a - b);
  }, [apartments]);

  const getAvailableCount = useCallback(() => {
    return filteredApartments.filter(apt => apt.status === 'available').length;
  }, [filteredApartments]);


  const { minPrice, maxPrice, minArea, maxArea } = useMemo(() => {
    if (apartments.length === 0) {
      return { minPrice: 0, maxPrice: 10000000, minArea: 0, maxArea: 200 };
    }
    const convertedPrices = apartments
      .map(apt => convertPrice(apt.price || 0, project?.currency, selectedCurrency))
      .filter(p => p > 0);
    const areas = apartments.map(apt => apt.area).filter(a => a > 0);
    return {
      minPrice: convertedPrices.length > 0 ? Math.min(...convertedPrices) : 0,
      maxPrice: convertedPrices.length > 0 ? Math.max(...convertedPrices) : 10000000,
      minArea: areas.length > 0 ? Math.min(...areas) : 0,
      maxArea: areas.length > 0 ? Math.max(...areas) : 200,
    };
  }, [apartments, selectedCurrency, project?.currency, convertPrice]);

  // Обновляем диапазон цен при смене валюты/проекта
  useEffect(() => {
    if (apartments.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [selectedCurrency, project?.currency, minPrice, maxPrice, apartments.length]);
  // minArea/maxArea уже посчитаны выше в useMemo

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

  // Filters component for reuse between mobile sheet and desktop inline
  const FiltersContent = () => (
    <div className={isMobile ? "space-y-6" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"}>
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

      {/* Currency filter - pill toggles */}
        {(() => {
          type Currency = 'RUB' | 'USD' | 'EUR' | 'GEL'
          const preferredOrder: Array<Exclude<Currency, 'RUB'>> = ['USD', 'GEL', 'EUR']
          const projectCurrency = (project?.currency || 'RUB') as Currency
          const list: Currency[] = [...preferredOrder, ...(preferredOrder.includes(projectCurrency as Exclude<Currency, 'RUB'>) ? [] : [projectCurrency])]
          const currenciesToShow = list.filter((c, i) => list.indexOf(c) === i)
          const symbol: Record<'RUB' | 'USD' | 'EUR' | 'GEL', string> = { RUB: '₽', USD: '$', EUR: '€', GEL: '₾' }
          return (
            <ToggleGroup type="single" value={selectedCurrency} onValueChange={(v) => v && setSelectedCurrency(v)} className="gap-2">
              {currenciesToShow.map((c) => (
                <ToggleGroupItem
                  key={c}
                  value={c}
                  size="sm"
                  aria-label={c}
                  className="rounded-full h-9 w-9 p-0 text-base bg-gray-100 text-gray-600 data-[state=on]:bg-black data-[state=on]:text-white"
                >
                  {symbol[c]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top header bar - always visible */}
      <div ref={filtersRef} className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-4">
          {/* View mode buttons */}
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-4`}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 truncate`}>{project.name}</h1>
            <div className={`flex ${isMobile ? 'justify-center' : 'items-center'} gap-1 md:gap-2`}>
                             <Button 
                 variant={viewMode === 'facade' ? 'default' : 'outline'} 
                 size="sm" 
                 className={`${viewMode === 'facade' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'} ${isMobile ? 'text-xs px-2' : ''}`}
                 onClick={() => setViewMode('facade')}
               >
                 <Building2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
                 {!isMobile && t('project.facade')}
               </Button>
               <Button 
                 variant={viewMode === 'floor-plan' ? 'default' : 'outline'} 
                 size="sm"
                 className={`${viewMode === 'floor-plan' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'} ${isMobile ? 'text-xs px-2' : ''}`}
                 onClick={() => setViewMode('floor-plan')}
               >
                 <Grid className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
                 {!isMobile && t('project.floorPlan')}
               </Button>
               <Button 
                 variant={viewMode === 'list' ? 'default' : 'outline'} 
                 size="sm"
                 className={`${viewMode === 'list' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'} ${isMobile ? 'text-xs px-2' : ''}`}
                 onClick={() => setViewMode('list')}
               >
                 <List className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
                 {!isMobile && t('project.listView')}
               </Button>

               <Button 
                 variant={viewMode === 'map' ? 'default' : 'outline'} 
                 size="sm"
                 className={`${viewMode === 'map' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'} ${isMobile ? 'text-xs px-2' : ''}`}
                 onClick={() => setViewMode('map')}
               >
                 <MapPin className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'} ${isMobile ? 'mr-0' : 'mr-1'}`} />
                 {!isMobile && t('embed.onMap')}
               </Button>
               
               {/* Mobile filters button */}
               {isMobile && (
                 <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                   <SheetTrigger asChild>
                     <Button variant="outline" size="sm" className="text-xs px-2">
                       <SlidersHorizontal className="h-3 w-3" />
                     </Button>
                   </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh]">
                    <SheetHeader>
                      <SheetTitle>{t('project.filters')}</SheetTitle>
                      <SheetDescription>
                        {t('project.filtersDescription')}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 overflow-y-auto">
                      <FiltersContent />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>

          {/* Desktop Filters */}
          {!isMobile && (
            <FiltersContent />
          )}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
        // List view - responsive layout
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="space-y-6">
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{t('project.apartmentsList')}</h2>
            
            {isMobile ? (
              // Mobile card layout
              <div className="space-y-4">
                {filteredApartments.map((apartment) => (
                  <Card key={apartment.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedApartment(apartment)}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-6 w-6 text-gray-400" />
                          </div>
                        </div>
                        <div className="flex-grow space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}
                            </span>
                            <Badge 
                              variant={apartment.status === 'available' ? 'default' : 'secondary'}
                              className={apartment.status === 'available' ? 'bg-green-500' : 'bg-gray-500'}
                            >
                              {apartment.status === 'available' ? t('common.available') : t('common.unavailable')}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>{apartment.area} м² • {apartment.floor_number} {t('project.floor').toLowerCase()}</div>
                              <div className="font-bold text-sm text-gray-900">
                                {apartment.price ? `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}` : t('project.onRequest')}
                              </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Desktop table layout
              <div className="space-y-4">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-5 gap-4 py-3 text-sm text-gray-500 border-b">
                  <div>{t('project.layout')}</div>
                  <div>{t('project.type')}</div>
                  <div>{t('project.area')}</div>
                  <div>{t('project.floor')}</div>
                  <div>{t('project.price')}</div>
                </div>
                
                {/* Apartment rows */}
                {filteredApartments.map((apartment) => (
                  <div key={apartment.id} className="grid grid-cols-5 gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApartment(apartment)}>
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
                      <span>{apartment.floor_number} {t('project.of')} {project.floors}</span>
                    </div>
                    <div className="flex items-center">
                      <div>
                        <div className="font-bold text-lg">{apartment.price ? `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}` : t('project.onRequest')}</div>
                        <div className="text-sm text-gray-500">{t('project.installmentFrom')}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'map' ?
      <>
      <InteractiveProjectsMap
     project={project}
     onProjectSelect={() => {
      setViewMode('list');
     }}
    />
      </>
      :(
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
                  <div className="container mx-auto px-4 md:px-6 py-8">
                    <div className="space-y-6">
                      <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{t('project.layouts')}</h3>
                      
                      {/* Layout type filters */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
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
                                  {(() => {
                                    const layoutKey = representativeApt.rooms === 0 ? 'studio' : `${representativeApt.rooms}-room`;
                                    const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
                                    const first = photos[0];
                                    return first ? (
                                      <img src={first.image_url} alt={representativeApt.rooms === 0 ? t('apartment.studio') : `${representativeApt.rooms}-${t('apartment.rooms')}`}
                                           className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400">{t('project.layoutPreview')}</div>
                                    );
                                  })()}
                                  
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
                                              ? `${formatPrice(minPrice)} ${getCurrencySymbolSafe(selectedCurrency)}`
                                              : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)} ${getCurrencySymbolSafe(selectedCurrency)}`
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
                      selectedFloorForPlan !== null ? apt.floor_number === selectedFloorForPlan : true
                    )}
                    onApartmentSelect={setSelectedApartment}
                    selectedFloorNumber={selectedFloorForPlan}
                  />
                </div>
              )}

     
            </div>

            {/* Floor selector for floor-plan mode */}
            {viewMode === 'floor-plan' && (
              <div className="bg-white border-b py-4">
                <div className="mx-auto px-6">
                  <div className="flex items-center justify-center gap-2 flex-col">
                    <Label className="text-sm font-medium">{t('project.selectFloor')}:</Label>
                    <div className="flex items-center gap-2 flex-wrap">
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
            <div
            id='apartment-summary'
            className="bg-gray-50 border-t">
              <div className="container mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Apartment Layout Images */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedApartment.rooms === 0 ? t('apartment.studio') : `${selectedApartment.rooms}-${t('apartment.rooms')}`}
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedApartment(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  
                    
                                         {/* Apartment Photos Viewer */}
                     <div className="space-y-4">
                       <ApartmentPhotosViewer apartmentId={selectedApartment.id} projectId={projectId} roomsHint={selectedApartment.rooms} />
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
                   
                    
                    </div>

                    {/* Price */}
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-500">{t('project.price')}</div>
                        <div className="font-bold text-2xl">
                          {selectedApartment.price ? `${formatPrice(convertPrice(selectedApartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}` : t('project.onRequest')}
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

                    
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
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
