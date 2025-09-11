import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProjects';


import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, Building2, Home, MapPin, Ruler, DollarSign, SlidersHorizontal, Calendar, Eye, List, Grid, Share, Heart, Maximize2, X } from 'lucide-react';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFields } from '@/hooks/useFields';
import { Language } from '@/lib/language-utils';
import ApartmentFloorPlan from './ApartmentFloorPlan';
import BuildingFacadeView from './BuildingFacadeView';
import ApartmentDetailsModal from './ApartmentDetailsModal';
import ApartmentReservationForm from './ApartmentReservationForm';
import ApartmentPhotosViewer from './ApartmentPhotosViewer';
import InteractiveProjectsMap from './InteractiveProjectsMap';
import { getCurrencySymbolSafe, isValidCurrency } from '@/lib/currency-utils';




interface ProjectApartmentSelectorProps {
  projectId: string;
}

const ProjectApartmentSelector = ({ projectId }: ProjectApartmentSelectorProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { project } = useProject(projectId);
  const { fields: fieldSettings } = useFields(projectId);

  // Функция для получения локализованного названия поля
  const getFieldLabel = (field: { field_label: string; field_label_translations?: Partial<Record<Language, string>> }) => {

    if (field.field_label_translations && field.field_label_translations[language]) {
      return field.field_label_translations[language];
    }
    return field.field_label;
  };

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);


  const [apartmentsLoaded, setApartmentsLoaded] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedRooms, setSelectedRooms] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [areaRange, setAreaRange] = useState<number[]>([0, 200]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [selectedType, setSelectedType] = useState<'all' | 'apartment' | 'commercial' | 'parking'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('RUB');
  const [viewMode, setViewMode] = useState<'facade' | 'floor-plan' | 'list' | 'map'>('facade');
  const [listViewMode, setListViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedFloorForPlan, setSelectedFloorForPlan] = useState<number | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isDesktopFiltersExpanded, setIsDesktopFiltersExpanded] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  // Отслеживаем, для каких этажей уже подгружены полигоны, чтобы не дёргать повторно
  const loadedPolygonsForFloorsRef = useRef<Set<number>>(new Set());
  // Кэш предзагруженных фото планировок по типу (rooms) → массив CombinedPhoto
  const [preloadedLayoutPhotosByRooms, setPreloadedLayoutPhotosByRooms] = useState<Record<string, { id: string; image_url: string; description?: string; order_index: number; type: 'layout' }[]>>({});
  // Ленивая предзагрузка: начнём только когда секция с планировками попала в видимую область

  // Загружаем проект только при изменении projectId или cachedProject
  useEffect(() => {

    if (project) {
      if (project.currency && isValidCurrency(project.currency)) {
        setSelectedCurrency(project.currency);
      }
    }
  }, [project]);

  // Загрузка списка квартир (без polygon)
  const loadApartments = useCallback(async () => {
    if (apartmentsLoaded) return; // Не загружаем повторно

    try {
      const { data, error } = await supabase
        .from('apartments')
        // Загружаем только необходимые поля без тяжёлого поля polygon
        .select('id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type')
        .eq('project_id', projectId);

      if (error) throw error;

      const normalizedApartments = (data || []).map(normalizeApartmentData);

      setApartments(normalizedApartments);
      setApartmentsLoaded(true);

      // Вычисляем диапазоны только один раз
      if (normalizedApartments.length > 0) {
        const prices = normalizedApartments
          .map(apt => (apt.price ? apt.price : 0))
        console.log('prices', prices);

        const areas = normalizedApartments.map(apt => apt.area);

        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          console.log('minPrice', minPrice);
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
    }
  }, [projectId, apartmentsLoaded]);


  // Загружаем квартиры только когда они нужны (при первом рендере или изменении projectId)
  useEffect(() => {

    if (projectId) {
      loadApartments();
    }
  }, [projectId, loadApartments]);



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
        apartments.map(a => (Number(a.rooms) === 0 ? 'studio' : `${Number(a.rooms)}-room`))
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
        filtered = filtered.filter(apt => Number(apt.rooms) >= 4);
      } else {
        filtered = filtered.filter(apt => Number(apt.rooms) === parseInt(selectedRooms));
      }
    }

    if (selectedType !== 'all') {
      console.log('selectedType', selectedType);
      filtered = filtered.filter(apt => apt.type === selectedType);
      console.log('filtered', filtered);
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
  }, [apartments, selectedFloor, selectedRooms, selectedType, showOnlyAvailable, priceRange, areaRange, searchQuery, selectedCurrency, project?.currency, convertPrice]);



  const getUniqueRoomCounts = useCallback(() => {
    return [...new Set(apartments.map(apt => typeof apt.rooms === 'string' ? parseInt(apt.rooms) : apt.rooms))].sort((a, b) => a - b);
  }, [apartments]);

  const getAvailableCount = useCallback(() => {
    return filteredApartments.filter(apt => apt.status === 'available').length;
  }, [filteredApartments]);

  // Группировка квартир по этажам для grid режима
  const groupApartmentsByFloor = useCallback(() => {
    const grouped = filteredApartments.reduce((acc, apartment) => {
      const floor = apartment.floor_number;
      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(apartment);
      return acc;
    }, {} as Record<number, Apartment[]>);

    // Сортируем этажи по убыванию (верхние этажи сверху)
    const sortedFloors = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedFloors.map(floor => ({
      floor,
      apartments: grouped[floor].sort((a, b) => {
        // Сортируем квартиры по номеру если он есть
        if (a.apartment_number && b.apartment_number) {
          return a.apartment_number.localeCompare(b.apartment_number);
        }
        return a.id.localeCompare(b.id);
      })
    }));
  }, [filteredApartments]);

  // Получаем отображаемые поля в правильном порядке
  const getVisibleFields = useCallback(() => {
    return fieldSettings
      .filter(field => field.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [fieldSettings]);

  // Получаем значение кастомного поля из апартамента
  const getCustomFieldValue = useCallback((apartment: Apartment, fieldName: string) => {
    if (!apartment.custom_fields) return null;

    const customFields = apartment.custom_fields as Record<string, unknown>;
    return customFields[fieldName] || null;
  }, []);

  // Форматируем значение поля для отображения
  const formatFieldValue = useCallback((value: unknown, fieldType: string, fieldName: string) => {
    if (value === null || value === undefined || ((value === 0 || Number.isNaN(value)) && (selectedType == 'commercial' || selectedType == 'parking'))) return '-';

    if (fieldName === 'price') {
      return formatPrice(convertPrice(value as number, project?.currency, selectedCurrency)) + ' ' + getCurrencySymbolSafe(selectedCurrency);
    }

    if (fieldName === 'area') {
      return value + ' м²';
    }

    if (fieldName === 'floor_number') {
      return value + ' ' + t('project.floor').toLowerCase();
    }

    if (fieldName === 'rooms') {
      if (value === 0) {
        return t('apartment.studio');
      } else {
        console.log('value', value, typeof value);
        return value + ' ' + t('apartment.room').toLowerCase();
      }
    }



    switch (fieldType) {
      case 'boolean':
        return value ? 'Да' : 'Нет';
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value);
      case 'select':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return String(value);
    }
  }, [selectedCurrency, selectedType, convertPrice, project?.currency, t]);


  const { minPrice, maxPrice, minArea, maxArea } = useMemo(() => {
    if (apartments.length === 0) {
      return { minPrice: 0, maxPrice: 10000000, minArea: 0, maxArea: 200 };
    }
    const convertedPrices = apartments
      .map(apt => convertPrice(apt.price || 0, project?.currency, selectedCurrency))
    const areas = apartments.map(apt => apt.area)
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

  if (!project) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">{t('project.loading')}</p>
        </div>
      </div>
    );
  }

  // Compact filters for desktop - only essential filters
  const CompactFiltersContent = () => (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Rooms filter */}
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

      {viewMode !== 'floor-plan' && (
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

      {/* Available only switch */}
      <div className="flex items-center space-x-2">
        <Switch
          checked={showOnlyAvailable}
          onCheckedChange={setShowOnlyAvailable}
        />
        <Label className="text-sm">{t('project.onlyAvailable')}</Label>
      </div>
    </div>
  );

  // Expanded filters - price and area sliders
  const ExpandedFiltersContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    </div>
  );

  // Full filters for mobile
  const FiltersContent = () => (
    <div className="space-y-6">
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
                  className="rounded-full h-9 w-9 p-0 text-base bg-gray-100 text-gray-600 data-[state=on]:bg-black data-[state=on]:text-white"
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
    <div className="min-h-full bg-white flex flex-col">
     { (viewMode !== 'list' ? false : !!selectedApartment) ?


      <ApartmentDetailsModal
        apartment={selectedApartment}
        isOpen={viewMode !== 'list' ? false : !!selectedApartment}
        onClose={() => setSelectedApartment(null)}
      />

      :

      <>
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
                 <SheetContent side="top" className="h-[700px]">
                   <SheetHeader>
                     <SheetTitle>{t('project.filters')}</SheetTitle>
                     <SheetDescription>
                       {t('project.filtersDescription')}
                     </SheetDescription>
                   </SheetHeader>
                   <div className="mt-6 overflow-y-auto py-4 max-h-[80%]">
                     <FiltersContent />
                   </div>
                 </SheetContent>
               </Sheet>
             )}
           </div>
         </div>

         {/* Desktop Filters */}
         {!isMobile && (
           <div className="space-y-4">
             {/* Compact filters row */}
             <div className="flex items-center justify-between">
               <CompactFiltersContent />
              {/*  <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setIsDesktopFiltersExpanded(!isDesktopFiltersExpanded)}
                 className="flex items-center gap-2"
               >
                 <SlidersHorizontal className="h-4 w-4" />
                 {isDesktopFiltersExpanded ? t('common.hide') : t('project.moreFilters')}
               </Button> */}
             </div>
             
             {/* Expanded filters - animated */}
             <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
               isDesktopFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
             }`}>
               <div className="pt-4 border-t border-gray-200">
                 <ExpandedFiltersContent />
               </div>
             </div>
           </div>
         )}
       </div>
     </div>

     {/* Content based on view mode */}
     {viewMode === 'list' ? (
       // List view - responsive layout
       <div className="container mx-auto px-4 md:px-6 py-8 grow">
         <div className={(project?.has_commercial || project?.has_parking) ? "space-y-6" : ""}>
           <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{t('project.apartmentsList')}</h2>

           {/* Type selector tabs - only show if project has commercial or parking */}
           {(project?.has_commercial || project?.has_parking) && (
             <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as 'all' | 'apartment' | 'commercial' | 'parking')}>
               <TabsList className="flex w-full md:flex-row flex-col h-auto">
                 <TabsTrigger className="w-full" value="all">{t('project.allTypes')}</TabsTrigger>
                 <TabsTrigger className="w-full" value="apartment">{t('apartmentsManager.typeApartment')}</TabsTrigger>
                 {project?.has_commercial && (
                   <TabsTrigger className="w-full" value="commercial">{t('apartmentsManager.typeCommercial')}</TabsTrigger>
                 )}
                 {project?.has_parking && (
                   <TabsTrigger className="w-full" value="parking">{t('apartmentsManager.typeParking')}</TabsTrigger>
                 )}
               </TabsList>
             </Tabs>
           )}

           {/* View mode toggle - only show on desktop */}
           {!isMobile && (
               <div className="flex items-center justify-end gap-2">
                 <Button
                   variant={listViewMode === 'list' ? 'default' : 'outline'}
                   size="sm"
                   className={listViewMode === 'list' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                   onClick={() => setListViewMode('list')}
                 >
                   <List className="h-4 w-4 mr-1" />
                   {t('common.list')}
                 </Button>
                 <Button
                   variant={listViewMode === 'grid' ? 'default' : 'outline'}
                   size="sm"
                   className={listViewMode === 'grid' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                   onClick={() => setListViewMode('grid')}
                 >
                   <Grid className="h-4 w-4 mr-1" />
                   {t('common.grid')}
                 </Button>
               </div>
           )}

           {isMobile ? (
             // Mobile card layout
             <div className="space-y-4">
               {filteredApartments.map((apartment) => (
                 <Card key={apartment.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedApartment(apartment)}>
                   <CardContent className="p-4">
                     <div className="flex items-center space-x-4">
                       <div className="flex-shrink-0">
                         <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                           {(() => {
                             const layoutKey = apartment.rooms === 0 ? 'studio' : `${apartment.rooms}-room`;
                             const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
                             const first = photos[0];
                             return first ? (
                               <img
                                 src={first.image_url}
                                 alt={apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms}-${t('apartment.rooms')}`}
                                 className="w-full h-full object-cover"
                               />
                             ) : (
                               <Building2 className="h-8 w-8 text-gray-400" />
                             );
                           })()}
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
                           {/* Custom fields for mobile */}
                           {getVisibleFields().slice(0, 2).map((field) => {
                             let value: unknown = null;

                             if (field.is_custom) {
                               value = getCustomFieldValue(apartment, field.field_name);
                             } else {
                               switch (field.field_name) {
                                 case 'rooms':
                                   value = apartment.rooms;
                                   break;
                                 case 'area':
                                   value = apartment.area;
                                   break;
                                 case 'price':
                                   value = apartment.price;
                                   break;
                                 case 'status':
                                   value = apartment.status;
                                   break;
                                 case 'floor':
                                   value = apartment.floor_number;
                                   break;
                                 case 'number':
                                   value = apartment.apartment_number;
                                   break;
                                 default:
                                   value = null;

                               }
                             }

                             if (value === null) return null;

                             return (
                               <div key={field.id} className="text-xs text-gray-500">
                                 {getFieldLabel(field)}: {formatFieldValue(value, field.field_type, field.field_name)}
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               ))}
             </div>
           ) : (
             // Desktop layout - list or grid
             <div className="space-y-4 overflow-y-auto">
               {listViewMode === 'list' ? (
                 // Desktop table layout
                 <>
                   {/* Table header */}
                   <div className={`hidden md:grid gap-4 py-3 text-sm text-gray-500 border-b`}
                     style={{ gridTemplateColumns: `200px 120px 100px 100px 150px ${getVisibleFields().map(() => '120px').join(' ')}` }}>
                     <div></div>
                     {getVisibleFields().map((field) => (
                       <div key={field.id}>{
                         field.is_custom ?
                           getFieldLabel(field)
                           :
                           t(`project.${field.field_name}`)
                       }</div>
                     ))}
                   </div>

                   {/* Apartment rows */}
                   {filteredApartments.map((apartment) => (
                     <div key={apartment.id}
                       className="hidden md:grid gap-4 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                       style={{ gridTemplateColumns: `200px 120px 100px 100px 150px ${getVisibleFields().map(() => '120px').join(' ')}` }}
                       onClick={() => setSelectedApartment(apartment)}>
                       <div className="flex items-center">
                         <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                           {(() => {
                             const layoutKey = apartment.rooms === 0 ? 'studio' : `${apartment.rooms}-room`;
                             const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
                             const first = photos[0];
                             return first ? (
                               <img
                                 src={first.image_url}
                                 alt={apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms}-${t('apartment.rooms')}`}
                                 className="w-full h-full object-cover"
                               />
                             ) : (
                               <Building2 className="h-8 w-8 text-gray-400" />
                             );
                           })()}
                         </div>
                       </div>

                       {getVisibleFields().map((field) => {
                         let value: unknown = null;

                         if (field.is_custom) {
                           value = getCustomFieldValue(apartment, field.field_name);
                         } else {
                           switch (field.field_name) {
                             case 'rooms':
                               value = apartment.rooms;
                               break;
                             case 'area':
                               value = apartment.area;
                               break;
                             case 'price':
                               value = apartment.price;
                               break;
                             case 'status':
                               value = apartment.status;
                               break;
                             case 'floor':
                               value = apartment.floor_number;
                               break;
                             case 'number':
                               value = apartment.apartment_number;
                               break;
                             default:
                               value = null;
                           }
                         }

                         return (
                           <div key={field.id} className="flex items-center">
                             <span>{formatFieldValue(value, field.field_type, field.field_name)}</span>
                           </div>
                         );
                       })}
                     </div>
                   ))}
                 </>
               ) : (
                 // Desktop grid layout - grouped by floors
                 <div className="hidden md:block space-y-8">
                   {groupApartmentsByFloor().map(({ floor, apartments: floorApartments }) => (
                     <div key={floor} className="space-y-4">
                       {/* Floor header */}
                       <div className="flex items-center gap-4">
                         <h3 className="text-xl font-semibold text-gray-800">
                           {floor} {t('project.floor').toLowerCase()}
                         </h3>
                         <div className="flex-1 h-px bg-gray-200"></div>
                         <span className="text-sm text-gray-500">
                           {floorApartments.length} {floorApartments.length === 1 ? t('apartment.apartment') : t('apartment.apartments')}
                         </span>
                       </div>

                       {/* Apartments grid for this floor */}
                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                         {floorApartments.map((apartment) => (
                           <Card
                             key={apartment.id}
                             className={`aspect-square overflow-hidden hover:shadow-lg transition-all cursor-pointer border-2 ${apartment.status === 'available'
                                 ? 'border-green-200 hover:border-green-400 bg-green-50 hover:bg-green-100'
                                 : 'border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
                               }`}
                             onClick={() => setSelectedApartment(apartment)}
                           >
                             <CardContent className="p-3 h-full flex flex-col justify-between">
                               {/* Apartment number */}
                               <div className="text-center">
                                 <div className="text-sm font-bold text-gray-900 mb-1 ">
                                   {apartment.apartment_number || `#${apartment.id.slice(-4)}`}
                                 </div>
                                 <Badge
                                   variant={apartment.status === 'available' ? 'default' : 'secondary'}
                                   className={`text-[8px] ${apartment.status === 'available'
                                       ? 'bg-green-500 text-white'
                                       : 'bg-gray-500 text-white'
                                     }`}
                                 >
                                   {apartment.status === 'available' ? t('common.available') : t('common.unavailable')}
                                 </Badge>
                               </div>

                               {/* Apartment info */}
                               <div className="text-center space-y-1">
                                 <div className="text-sm font-medium text-gray-700">
                                   {!Number.isNaN(apartment.rooms) &&
                                     <>
                                       {apartment.rooms === 0 ? t('apartment.studio') : `${apartment.rooms} ${t('apartment.rooms')}`}
                                     </>
                                   }
                                 </div>
                                 <div className="text-xs text-gray-600">
                                   {apartment.area} м²
                                 </div>
                                 <div className="text-xs font-semibold text-gray-900">
                                   {apartment.price ?
                                     `${formatPrice(convertPrice(apartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}`
                                     : t('project.onRequest')
                                   }
                                 </div>
                               </div>
                             </CardContent>
                           </Card>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
         </div>
       </div>
     ) : viewMode === 'map' ?
       <>
         <InteractiveProjectsMap
           project={project ? { ...project, min_price: null } : undefined}
           onProjectSelect={() => {
             setViewMode('list');
           }}
         />
       </>
       : (
         // Facade and Floor Plan views with hero section
         <>
           {/* Main visualization area */}
           <div className="relative grow flex flex-col">
             {/* Hero section with building visualization */}
             <div className="relative overflow-hidden">
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
                           variant={selectedRooms === 'all' && selectedType === 'all' ? 'default' : 'outline'}
                           size="sm"
                           className={selectedRooms === 'all' && selectedType === 'all' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                           onClick={() => {
                             setSelectedType('all');
                             setSelectedRooms('all')
                           }}
                         >
                           {t('project.allTypes')}
                         </Button>
                         <Button
                           variant={selectedRooms === '0' ? 'default' : 'outline'}
                           size="sm"
                           className={selectedRooms === '0' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                           onClick={() => {
                             setSelectedType('all');

                             setSelectedRooms('0')
                           }}
                         >
                           {t('apartment.studio')}
                         </Button>
                         {getUniqueRoomCounts().filter(rooms => rooms > 0).map(rooms => (
                           <Button
                             key={rooms}
                             variant={selectedRooms === rooms.toString() ? 'default' : 'outline'}
                             size="sm"
                             className={selectedRooms === rooms.toString() ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                             onClick={() => {
                               setSelectedType('all');
                               setSelectedRooms(rooms.toString())
                             }}
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
                             const fourPlusApartments = apartments.filter(apt => Number(apt.rooms) >= 4 && apt.type === 'apartment');
                             if (fourPlusApartments.length > 0) {
                               setSelectedRooms('4+');
                               setSelectedType('apartment');
                             }
                           }}
                         >
                           4+
                         </Button>
                         {project?.has_commercial && (
                           <Button
                             variant={selectedType === 'commercial' ? 'default' : 'outline'}
                             size="sm"
                             className={selectedType === 'commercial' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                             onClick={() => {
                               setSelectedType('commercial');
                               setSelectedRooms('all');
                             }}
                           >
                             {t('apartmentsManager.typeCommercial')}
                           </Button>
                         )}
                         {project?.has_parking && (
                           <Button
                             variant={selectedType === 'parking' ? 'default' : 'outline'}
                             size="sm"
                             className={selectedType === 'parking' ? 'bg-[#1E1E1E] text-white' : 'border-gray-300'}
                             onClick={() => {
                               setSelectedType('parking');
                               setSelectedRooms('all');
                             }}
                           >
                             {t('apartmentsManager.typeParking')}
                           </Button>
                         )}
                       </div>

                       {/* Layout cards grid */}
                       <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
                         {(() => {
                           // Group apartments by layout depending on type
                           const layoutGroups: { [key: string]: Apartment[] } = {};

                           let apartmentsToShow = apartments;

                           // Apply selected type filter for gallery
                           if (selectedType !== 'all') {
                             apartmentsToShow = apartmentsToShow.filter(apt => apt.type === selectedType);
                           }

                           // Rooms filter applies only to residential apartments
                           if (selectedRooms !== 'all') {
                             if (selectedRooms === '4+') {
                               apartmentsToShow = apartmentsToShow.filter(apt => apt.type === 'apartment' && Number(apt.rooms) >= 4);
                             } else {
                               apartmentsToShow = apartmentsToShow.filter(apt => apt.type === 'apartment' && Number(apt.rooms) === parseInt(selectedRooms));
                             }
                           }

                           apartmentsToShow.forEach(apt => {
                             let key: string;
                             if (apt.type === 'commercial') {
                               key = 'commercial';
                             } else if (apt.type === 'parking') {
                               key = 'parking';
                             } else {
                               key = `${Number(apt.rooms)}-rooms`;
                             }
                             if (!layoutGroups[key]) {
                               layoutGroups[key] = [];
                             }
                             layoutGroups[key].push(apt);
                           });

                           return Object.entries(layoutGroups).map(([key, apartmentGroup]) => {
                             const representativeApt = apartmentGroup[0];
                             const availableCount = apartmentGroup.filter(apt => apt.status === 'available').length;
                             const totalCount = apartmentGroup.length;

                             const isCommercial = representativeApt.type === 'commercial';
                             const isParking = representativeApt.type === 'parking';

                             return (
                               <Card key={key} className="overflow-hidden hover:shadow-lg transition-shadow">
                                 <div className="aspect-[4/3] bg-gray-100 relative">
                                   {(() => {
                                     if (isCommercial || isParking) {
                                       return (
                                         <div className="w-full h-full flex items-center justify-center text-gray-400">
                                           {isCommercial ? t('apartmentsManager.typeCommercial') : t('apartmentsManager.typeParking')}
                                         </div>
                                       );
                                     }
                                     const layoutKey = representativeApt.rooms === 0 ? 'studio' : `${Number(representativeApt.rooms)}-room`;
                                     const photos = preloadedLayoutPhotosByRooms[layoutKey] || [];
                                     const first = photos[0];
                                     return first ? (
                                       <img src={first.image_url} alt={representativeApt.rooms === 0 ? t('apartment.studio') : `${String(representativeApt.rooms)}-${t('apartment.rooms')}`}
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
                                       {isCommercial ? t('apartmentsManager.typeCommercial') : isParking ? t('apartmentsManager.typeParking') : (representativeApt.rooms === 0 ? t('apartment.studio') : `${String(representativeApt.rooms)}-${t('apartment.rooms')}`)}
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
                                         if (isCommercial) {
                                           setSelectedType('commercial');
                                           setSelectedRooms('all');
                                         } else if (isParking) {
                                           setSelectedType('parking');
                                           setSelectedRooms('all');
                                         } else {
                                           setSelectedType('apartment');
                                           setSelectedRooms(Number(representativeApt.rooms) >= 4 ? '4+' : String(representativeApt.rooms));
                                         }
                                         setViewMode('list');
                                       }}
                                     >
                                       {t('project.viewApartments', { count: totalCount })}
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
               <div className="bg-white border-b py-4 ">
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
                       <ApartmentPhotosViewer apartmentId={selectedApartment.id} projectId={projectId} roomsHint={Number(selectedApartment.rooms)} />
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

                     {/* Custom fields */}
                     {getVisibleFields().length > 0 && (
                       <div className="space-y-3">
                         <h4 className="text-sm font-medium text-gray-700">{t('project.additionalInfo')}</h4>
                         <div className="grid grid-cols-1 gap-3">
                           {getVisibleFields().map((field) => {
                             let value: unknown = null;

                             if (field.is_custom) {
                               // Для кастомных полей берем значение из custom_fields
                               value = getCustomFieldValue(selectedApartment, field.field_name);
                             } else {
                               // Для стандартных полей берем из основных свойств апартамента
                               switch (field.field_name) {
                                 case 'rooms':
                                   value = selectedApartment.rooms;
                                   break;
                                 case 'area':
                                   value = selectedApartment.area;
                                   break;
                                 case 'price':
                                   value = selectedApartment.price;
                                   break;
                                 case 'status':
                                   value = selectedApartment.status;
                                   break;
                                 case 'floor':
                                   value = selectedApartment.floor_number;
                                   break;
                                 case 'number':
                                   value = selectedApartment.apartment_number;
                                   break;
                                 default:
                                   value = null;
                               }
                             }

                             return (
                               <div key={field.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                 <span className="text-sm text-gray-600">{getFieldLabel(field)}</span>
                                 <span className="text-sm font-medium text-gray-900">
                                   {formatFieldValue(value, field.field_type, field.field_name)}
                                 </span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}

                     {/* Price */}
                     <div className="bg-white rounded-lg p-4 border">
                       <div className="space-y-2">
                         <div className="text-sm text-gray-500">{t('project.price')}</div>
                         <div className="font-bold text-2xl">
                           {selectedApartment.price ? `${formatPrice(convertPrice(selectedApartment.price, project?.currency, selectedCurrency))} ${getCurrencySymbolSafe(selectedCurrency)}` : t('project.onRequest')}
                         </div>
                       </div>
                     </div>

                     {/* Action buttons */}
                     {selectedApartment.status === 'available' && !isReserveOpen && (
                       <Button
                         className="flex-1 bg-[#1E1E1E] hover:bg-[#1E1E1E]/90 text-white w-full"
                         onClick={() => setIsReserveOpen(true)}
                       >
                         {t('common.reserve')}
                       </Button>
                     )}
                     {selectedApartment.status !== 'available' && (
                       <Button className="flex-1 bg-[#1E1E1E]/50 text-white w-full" disabled>
                         {t('common.unavailable')}
                       </Button>
                     )}
                     {isReserveOpen && selectedApartment.status === 'available' && (
                       <div className="mt-3 rounded-md border p-4">
                         <h3 className="font-medium mb-3">{t('common.reserve')} {t('apartment.apartment')}</h3>
                         <ApartmentReservationForm
                           apartmentId={selectedApartment.id}
                           projectId={selectedApartment.project_id}
                           onSubmit={() => setIsReserveOpen(false)}
                           onCancel={() => setIsReserveOpen(false)}
                         />
                       </div>
                     )}


                   </div>
                 </div>
               </div>
             </div>
           )}
         </>
       )}
     </>
     }



      
    </div>
  );
};

export default ProjectApartmentSelector;
