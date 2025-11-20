import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProjects';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { SlidersHorizontal, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFields } from '@/hooks/useFields';
import { Language } from '@/lib/language-utils';
import ApartmentFloorPlan from '../apartment/ApartmentFloorPlan';
import BuildingFacadeView from '../visualization/BuildingFacadeView';
import { useFavorites } from '@/hooks/useFavorites';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

// Import new components
import { useProjectFilters } from './hooks/useProjectFilters';
import { ViewModeButtons } from './ViewModeButtons';
import { CompactFilters } from './filters/CompactFilters';
import { ExpandedFilters } from './filters/ExpandedFilters';
import { MobileFilters } from './filters/MobileFilters';
import { LayoutGallery } from './layouts/LayoutGallery';

interface ProjectApartmentSelectorProps {
  projectId: string;
  isWidget?: boolean;
}

// Lazy load components at module level (outside component)
const ApartmentDetailsPage = lazy(() => import('@/pages/ApartmentDetailsPage'))
const InteractiveProjectsMap = lazy(() => import('@/components/visualization/InteractiveProjectsMap'))
const FavoritesTab = lazy(() => import('../FavoritesTab'))
const ListView = lazy(() => import('./views/ListView').then(module => ({ default: module.ListView })))
const FloorSelector = lazy(() => import('./FloorSelector').then(module => ({ default: module.FloorSelector })))

const ProjectApartmentSelector = ({ projectId, isWidget = false }: ProjectApartmentSelectorProps) => {

  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { project } = useProject(projectId);
  const { fields: fieldSettings } = useFields(project?.id || null);
  const { favoritesCount } = useFavorites(project?.id || undefined);
  const { user } = useAuth();


  // State
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [apartmentsLoaded, setApartmentsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'facade' | 'floor-plan' | 'list' | 'map' | 'favorites'>('facade');
  const [listViewMode, setListViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedFloorForPlan, setSelectedFloorForPlan] = useState<number | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isDesktopFiltersExpanded, setIsDesktopFiltersExpanded] = useState(false);
  const [stagedPriceRange, setStagedPriceRange] = useState<number[] | null>(null);
  const [stagedAreaRange, setStagedAreaRange] = useState<number[] | null>(null);
  const [preloadedLayoutPhotosByRooms, setPreloadedLayoutPhotosByRooms] = useState<Record<string, { id: string; image_url: string; description?: string; order_index: number; type: 'layout' }[]>>({});
  const [buildingImageLoaded, setBuildingImageLoaded] = useState(false);
  const [preloadLayoutLoaded, setPreloadLayoutLoaded] = useState(false);
  const [buildingImageNaturalSize, setBuildingImageNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);

  const filtersRef = useRef<HTMLDivElement>(null);
  const loadedPolygonsForFloorsRef = useRef<Map<number, Apartment[]>>(new Map());
  const polygonsLoadingRef = useRef<Set<number>>(new Set());
  const imageLoadRef = useRef<HTMLImageElement | null>(null);

  // Use filters hook
  const filters = useProjectFilters(
    project
      ? {
          apartments,
          project: project as unknown as { currency?: string; has_commercial?: boolean; has_parking?: boolean },
        }
      : { apartments }
  );

  // Helper functions
  const getFieldLabel = (field: { field_label: string; field_label_translations?: Partial<Record<Language, string>> }) => {
    if (field.field_label_translations && field.field_label_translations[language]) {
      return field.field_label_translations[language];
    }
    return field.field_label;
  };

  const getThemeColor = () => {
    return (project as unknown as Record<string, unknown>)?.theme_color as string || '#000000';
  };

  const getBaseDomain = async () => {

    // Получаем текущий домен
    const currentHostname = window.location.hostname;

    // Получаем домены проекта из project_domains
    const { data: projectDomains } = await supabase
      .from('project_domains')
      .select('domain, is_primary, status')
      .eq('project_id', project?.id || projectId)
      .eq('status', 'active');

    // Проверяем, есть ли текущий домен среди доменов проекта
    const isProjectDomain = projectDomains?.some(
      pd => pd.domain.toLowerCase() === currentHostname.toLowerCase()
    );
    // Определяем базовый домен
    let baseDomain: string;
    if (isProjectDomain) {
      // Используем текущий домен
      baseDomain = window.location.origin;
    } else {

      const primaryDomain = projectDomains?.find(pd => pd.is_primary)?.domain;
      if (primaryDomain) {
        baseDomain = 'https://' + primaryDomain;
      } else {
        baseDomain = 'https://' + import.meta.env.VITE_SERVER_DOMAIN || 'https://gridix.live';
      }

    }

    return baseDomain;
  };

  const openApartmentDetails = async (apartment: Apartment) => {
    // Если мы в виджете, показываем модальное окно вместо редиректа
    if (isWidget) {
      setSelectedApartment(apartment);
      setIsApartmentModalOpen(true);
      return;
    }

    // Иначе открываем в новой вкладке (старая логика)
    try {


      const baseDomain = process.env.NODE_ENV === 'production' ? await getBaseDomain() : '';

      // Формируем путь к проекту
      const projectPath = project?.slug ? project.slug : `id/${project?.id || projectId}`;

      // Формируем полный URL
      const url = `${baseDomain}/${language}/project/${projectPath}/apartment/${apartment.apartment_number}`;

      // Открываем в новой вкладке
      window.open(url, '_self');
    } catch (error) {
      console.error('Error opening apartment details:', error);
      // В случае ошибки используем запасной вариант
      const fallbackDomain = import.meta.env.VITE_SERVER_DOMAIN || 'https://gridix.live';
      const projectPath = project?.slug ? project.slug : `id/${project?.id || projectId}`;
      const url = `${fallbackDomain}/${language}/project/${projectPath}/apartment/${apartment.apartment_number}`;
      window.open(url, '_self');
    }
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US').format(Math.round(price));

  // Load apartments and layout photos in parallel (optimized)
  useEffect(() => {
    if (!project?.id || apartmentsLoaded) return;

    let isCancelled = false;

    const loadDataInParallel = async () => {
      try {
        // Load apartments
        const apartmentsResult = await supabase
          .from('apartments')
          .select('id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type')
          .eq('project_id', project.id);

        if (isCancelled) return;

        // Process apartments
        const { data, error } = apartmentsResult;
        if (error) throw error;

        const normalizedApartments = (data || []).map(normalizeApartmentData);
        if (!isCancelled) {
          setApartments(normalizedApartments);
          setApartmentsLoaded(true);

          // Now load layout photos for visible apartments only (non-blocking)
          // This happens after apartments are loaded, so UI can render
            const uniqueLayouts = new Set<string>(
              normalizedApartments.map(a =>
                (a.type === 'apartment' 
                  ? a.rooms == 0 
                    ? 'studio' 
                    : a.rooms === 'free_layout'
                      ? 'free_layout'
                      : `${Number(a.rooms)}-room` 
                  : a.type)
              )
            );


          if (uniqueLayouts.size > 0 && !isCancelled) {
            // Load layout photos asynchronously without blocking
            (async () => {
              try {
                const { data: layoutData, error: layoutError } = await supabase
                  .from('layout_photos')
                  .select('id, project_id, layout_type, image_url, description, order_index')
                  .eq('project_id', project.id)
                  .in('layout_type', Array.from(uniqueLayouts))
                  .order('order_index', { ascending: true });
                  
                if (layoutError) {
                  console.error('Error loading layout photos:', layoutError);
                  setPreloadLayoutLoaded(true);
                  return;
                }

                const grouped: Record<string, { id: string; image_url: string; description?: string; order_index: number; type: 'layout' }[]> = {};

                (layoutData || []).forEach(p => {
                  const key = p.layout_type;
                  if (!grouped[key]) grouped[key] = [];
                  const item: { id: string; image_url: string; description?: string; order_index: number; type: 'layout' } = {
                    id: p.id,
                    image_url: p.image_url,
                    order_index: p.order_index,
                    type: 'layout'
                  };
                  if (p.description) {
                    item.description = p.description;
                  }
                  grouped[key].push(item);
                });

                console.log('Layout photos loaded:', Object.keys(grouped).length, 'types'); // Debug log
                setPreloadedLayoutPhotosByRooms(grouped);
                setPreloadLayoutLoaded(true);
              } catch (e: unknown) {
                console.error('Error preloading layout photos:', e);
                setPreloadLayoutLoaded(true);
              }
            })();
          } else {
            setPreloadLayoutLoaded(true);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading apartments:', error);
          setApartmentsLoaded(true);
          setPreloadLayoutLoaded(true);
        }
      }
    };

    loadDataInParallel();

    return () => {
      isCancelled = true;
    };
  }, [project?.id, apartmentsLoaded]);

  // Lazy load building facade image (non-blocking)
  useEffect(() => {
    // Cancel previous image load
    if (imageLoadRef.current) {
      imageLoadRef.current.onload = null;
      imageLoadRef.current.onerror = null;
      imageLoadRef.current.src = '';
    }

    setBuildingImageLoaded(false);
    setBuildingImageNaturalSize({ width: 0, height: 0 });
    const imageUrl = project?.building_image_url;

    if (!imageUrl) {
      // Allow UI to render even without image
      setBuildingImageLoaded(true);
      return;
    }

    // Load image asynchronously without blocking UI
    const img = new Image();
    imageLoadRef.current = img;

    img.onload = () => {
      if (img === imageLoadRef.current) {
        setBuildingImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setBuildingImageLoaded(true);
      }
    };

    img.onerror = () => {
      // In case of error, still allow UI to proceed
      if (img === imageLoadRef.current) {
        setBuildingImageLoaded(true);
      }
    };

    // Start loading (non-blocking)
    img.src = imageUrl;

    return () => {
      if (imageLoadRef.current === img) {
        imageLoadRef.current.onload = null;
        imageLoadRef.current.onerror = null;
        imageLoadRef.current = null;
      }
    };
  }, [project?.building_image_url]);

  // Set default floor when apartments load
  useEffect(() => {
    if (apartments.length > 0 && selectedFloorForPlan === null) {
      const uniqueFloors = filters.getUniqueFloors();
      if (uniqueFloors.length > 0 && uniqueFloors[0] !== undefined) {
        setSelectedFloorForPlan(uniqueFloors[0]);
      }
    }
  }, [apartments, filters, selectedFloorForPlan]);



  // Load polygons for floor plan view (optimized with caching)
  useEffect(() => {
    const loadPolygonsForFloor = async (floor: number) => {
      if (!project?.id || polygonsLoadingRef.current.has(floor)) return;

      // Check if already cached
      if (loadedPolygonsForFloorsRef.current.has(floor)) {
        const cached = loadedPolygonsForFloorsRef.current.get(floor);
        if (cached && cached.length > 0) {
          // Update apartments with cached polygons
          setApartments(prev => prev.map(apt => {
            const found = cached.find(d => d.id === apt.id);
            if (!found || apt.floor_number !== floor) return apt;
            return {
              ...apt,
              polygon: Array.isArray(found.polygon) ? found.polygon as { x: number; y: number }[] : apt.polygon
            };
          }));
          return;
        }
      }

      polygonsLoadingRef.current.add(floor);

      try {
        const { data, error } = await supabase
          .from('apartments')
          .select('id, polygon')
          .eq('project_id', project.id)
          .eq('floor_number', floor);

        if (error) throw error;

        if (data && data.length > 0) {
          // Cache the polygons - store raw data, not Apartment objects
          loadedPolygonsForFloorsRef.current.set(floor, data as unknown as Apartment[]);

          // Update apartments efficiently - only update those on this floor
          setApartments(prev => prev.map(apt => {
            if (apt.floor_number !== floor) return apt;
            const found = data.find(d => d.id === apt.id);
            if (!found) return apt;
            return {
              ...apt,
              polygon: Array.isArray(found.polygon) ? found.polygon as { x: number; y: number }[] : []
            };
          }));
        }
      } catch (e) {
        console.error('Error loading polygons for floor:', e);
      } finally {
        polygonsLoadingRef.current.delete(floor);
      }
    };

    if (viewMode === 'floor-plan' && selectedFloorForPlan !== null) {
      loadPolygonsForFloor(selectedFloorForPlan);
    }
  }, [viewMode, selectedFloorForPlan, project?.id]);

  // Helper functions for fields
  const getVisibleFields = useCallback(() => {
    return fieldSettings
      .filter(field => field.is_visible)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [fieldSettings]);

  const getCustomFieldValue = useCallback((apartment: Apartment, fieldName: string) => {
    if (!apartment.custom_fields) return null;
    const customFields = apartment.custom_fields as Record<string, unknown>;
    return customFields[fieldName] || null;
  }, []);

  const formatFieldValue = useCallback((value: unknown, fieldType: string, fieldName: string) => {
    if (value === null || value === undefined || ((value === 0 || Number.isNaN(value)) && (filters.selectedType == 'commercial' || filters.selectedType == 'parking'))) return '-';

    if (fieldName === 'price') {
      return formatPrice(filters.convertPrice(value as number, project?.currency, filters.selectedCurrency)) + ' ' + filters.selectedCurrency;
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
  }, [filters, project?.currency, t]);

  // Group apartments by floor for grid mode (memoized for performance)
  const groupApartmentsByFloor = useMemo(() => {
    const grouped = filters.filteredApartments.reduce((acc, apartment) => {
      const floor = apartment.floor_number;
      if (!acc[floor]) {
        acc[floor] = [];
      }
      acc[floor].push(apartment);
      return acc;
    }, {} as Record<number, Apartment[]>);

    const sortedFloors = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedFloors.map(floor => ({
      floor,
      apartments: (grouped[floor] || []).sort((a, b) => {
        if (a.apartment_number && b.apartment_number) {
          return a.apartment_number.localeCompare(b.apartment_number);
        }
        return a.id.localeCompare(b.id);
      })
    }));
  }, [filters.filteredApartments]);

  if (!project) return null;

  // Show incremental loading - don't block UI completely
  const isInitialLoading = !apartmentsLoaded;
  const showContent = apartmentsLoaded; // Show content as soon as apartments are loaded

  // Check subscription status
  const isSubscriptionExpired = project.subscription_expires_at &&
    new Date(project.subscription_expires_at) < new Date();
  const isSubscriptionInactive = !['active', 'trialing', 'trial'].includes(project.subscription_status || '') || isSubscriptionExpired;
  const isOwner = user && project.user_id === user.id;

  // If widget mode and apartment is selected, show apartment details
  if (isWidget && isApartmentModalOpen && selectedApartment) {
    return (
      <Suspense fallback={<Loader color={getThemeColor()} size="lg" className="mx-auto" />}>
        <ApartmentDetailsPage
          onClose={() => {
            setIsApartmentModalOpen(false);
            setSelectedApartment(null);
          }}
          useId={true} apartmentIdProp={selectedApartment.id} projectIdProp={projectId} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {isInitialLoading && (
        <div className="absolute z-50 inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <Loader
            color={getThemeColor()}
            size="lg" className="mx-auto" />
        </div>
      )}
      {/* Subscription Warning Banner */}
      {isSubscriptionInactive && (
        <Alert className="m-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-200">
            {isOwner
              ? language === 'ru'
                ? 'Подписка на проект истекла'
                : 'Project Subscription Expired'
              : language === 'ru'
                ? 'Этот проект временно недоступен'
                : 'This project is temporarily unavailable'
            }
          </AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            {isOwner
              ? language === 'ru'
                ? 'Для продолжения работы с проектом необходимо продлить подписку. Перейдите в раздел "Подписка" в админ-панели.'
                : 'To continue working with this project, please renew your subscription. Go to the "Subscription" section in the admin panel.'
              : language === 'ru'
                ? 'Владелец проекта приостановил доступ к проекту. Пожалуйста, свяжитесь с ним для получения дополнительной информации.'
                : 'The project owner has suspended access to this project. Please contact them for more information.'
            }
          </AlertDescription>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 border-yellow-600 text-yellow-800 hover:bg-yellow-100"
              onClick={() => window.location.href = `/${language}/admin#subscription`}
            >
              {language === 'ru' ? 'Перейти к подпискам' : 'Go to Subscriptions'}
            </Button>
          )}
        </Alert>
      )}

      {/* Top header bar - always visible */}
      <div ref={filtersRef} className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto  md:px-6 py-4">
          {/* View mode buttons */}
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-4`}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 truncate`}>{project.name}</h1>
            <div className={`flex ${isMobile ? 'justify-center' : 'items-center'} gap-1 md:gap-2 `}>
              <ViewModeButtons
                isWidget={isWidget}
                viewMode={viewMode}
                setViewMode={setViewMode}
                favoritesCount={favoritesCount}
                isMobile={isMobile}
                mapVisible={(!!project.latitude && !!project.longitude)}
                projectType={(project as unknown as Record<string, unknown>)?.project_type as 'building' | 'object' | null}
                themeColor={getThemeColor()}
              />

              {/* Mobile filters button */}
              {isMobile && viewMode === 'list' && (
                <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs px-2">
                      <SlidersHorizontal className="h-3 w-3" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="top" className="h-[80vh] px-2">
                    <SheetHeader>
                      <SheetTitle>{t('project.filters')}</SheetTitle>
                      <SheetDescription>
                        {t('project.filtersDescription')}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 overflow-y-auto p-4 max-h-[80%]">
                      <MobileFilters
                        {...filters}
                        priceRange={[filters.minPrice, filters.maxPrice]}
                        getUniqueRoomCounts={filters.getUniqueRoomCounts}
                        getUniqueFloors={filters.getUniqueFloors}
                        hasFreeLayout={filters.hasFreeLayout}
                        project={project }
                        viewMode={viewMode}
                        formatPrice={formatPrice}
                        themeColor={getThemeColor()}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>

          {/* Desktop Filters */}
          {!isMobile && viewMode === 'list' && (
            <div className="space-y-4">
                <CompactFilters
                  {...filters}
                  getUniqueRoomCounts={filters.getUniqueRoomCounts}
                  getUniqueFloors={filters.getUniqueFloors}
                  hasFreeLayout={filters.hasFreeLayout}
                  project={project}
                  viewMode={viewMode}
                  themeColor={getThemeColor()}
                  isDesktopFiltersExpanded={isDesktopFiltersExpanded}
                  setIsDesktopFiltersExpanded={() => {
                    if (!isDesktopFiltersExpanded) {
                      setStagedPriceRange([...filters.priceRange]);
                      setStagedAreaRange([...filters.areaRange]);
                    }
                    setIsDesktopFiltersExpanded(prev => !prev);
                  }}
                />
               
           

              {/* Expanded filters - animated */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isDesktopFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-4 border-t border-gray-200">
                  <ExpandedFilters
                    priceRange={stagedPriceRange ?? filters.priceRange}
                    setPriceRange={(v) => setStagedPriceRange(v)}
                    areaRange={stagedAreaRange ?? filters.areaRange}
                    setAreaRange={(v) => setStagedAreaRange(v)}
                    selectedCurrency={filters.selectedCurrency}
                    minPrice={filters.minPrice}
                    maxPrice={filters.maxPrice}
                    minArea={filters.minArea}
                    maxArea={filters.maxArea}
                    formatPrice={formatPrice}
                    themeColor={getThemeColor()}
                  />
                  <div className="flex justify-end mt-4">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (stagedPriceRange) filters.setPriceRange(stagedPriceRange);
                        if (stagedAreaRange) filters.setAreaRange(stagedAreaRange);
                        setIsDesktopFiltersExpanded(false);
                      }}
                      style={{ backgroundColor: getThemeColor(), color: '#fff' }}
                    >
                      {language === 'ru' ? 'Применить' : 'Apply'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content based on view mode - show content as soon as apartments are loaded */}
      {showContent ? (
        <>
          {viewMode === 'list' ? (
            <Suspense fallback={<Loader color={getThemeColor()} size="lg" className="mx-auto" />}>
              <ListView
                filteredApartments={filters.filteredApartments}
                listViewMode={listViewMode}
                setListViewMode={setListViewMode}
                selectedType={filters.selectedType}
                setSelectedType={filters.setSelectedType}
                openApartmentDetails={openApartmentDetails}
                preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
                getVisibleFields={getVisibleFields}
                getCustomFieldValue={getCustomFieldValue}
                formatFieldValue={formatFieldValue}
                getFieldLabel={getFieldLabel}
                groupApartmentsByFloor={groupApartmentsByFloor}
                convertPrice={filters.convertPrice}
                formatPrice={formatPrice}
                project={project}
                selectedCurrency={filters.selectedCurrency}
                isMobile={isMobile}
                themeColor={getThemeColor()}
              />
            </Suspense>
          ) : viewMode === 'map' ? (
            <Suspense fallback={<Loader color={getThemeColor()} size="lg" className="mx-auto" />}>
              <InteractiveProjectsMap
                project={project}
                onProjectSelect={() => {
                  setViewMode('list');
                }}
              />
            </Suspense>
          ) : viewMode === 'favorites' ? (
            <div className="container mx-auto py-8 grow">
              <Suspense fallback={<Loader color={getThemeColor()} size="lg" className="mx-auto" />}>
                <FavoritesTab
                  fieldVisible={fieldSettings.filter(field => field.is_visible).map(field => field.field_name)}
                  handleViewApartment={openApartmentDetails}
                  projectId={project.id} projectCurrency={project?.currency} />
              </Suspense>
            </div>
          ) : (
            // Facade and Floor Plan views with hero section
            <>
              {/* Main visualization area */}
              <div className="relative grow flex">
                {/* Hero section with building visualization */}
                <div className="relative w-full">
                  {viewMode === 'facade' ? (
                    // Building facade view with interactive floor polygons
                    <div className="w-full bg-white">
                      <BuildingFacadeView
                        projectId={project.id}
                        project={project}
                        apartments={filters.filteredApartments}
                        onFloorSelect={(floor) => {
                          setSelectedFloorForPlan(floor);
                          setViewMode('floor-plan');
                        }}
                        onApartmentSelect={openApartmentDetails}
                        filtersRef={filtersRef}
                        externalImageLoaded={buildingImageLoaded}
                        externalImageNaturalSize={buildingImageNaturalSize}
                        showOnlyAvailable={filters.showOnlyAvailable}
                        visibleFields={fieldSettings.filter(field => field.is_visible)}
                      />

                      {/* Layout gallery below facade when not expanded - hide for project_type = object */}
                      {(project)?.project_type !== 'object' && (
                        <LayoutGallery
                          apartments={apartments}
                          selectedRooms={filters.selectedRooms}
                          selectedType={filters.selectedType}
                          setSelectedRooms={filters.setSelectedRooms}
                          setSelectedType={filters.setSelectedType}
                          setViewMode={setViewMode}
                          getUniqueRoomCounts={filters.getUniqueRoomCounts}
                          hasFreeLayout={filters.hasFreeLayout}
                          preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
                          project={project}
                          formatPrice={formatPrice}
                          selectedCurrency={filters.selectedCurrency}
                          isMobile={isMobile}
                          themeColor={getThemeColor()}
                          visibleFields={fieldSettings.filter(field => field.is_visible)}
                        />
                      )}
                    </div>
                  ) : (
                    // Floor plan view for specific floor with sidebar
                    <div className="w-full bg-white min-h-[600px] h-full">
                      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full`}>
                        {/* Main floor plan area */}
                        <div className="flex-1 relative">
                          <ApartmentFloorPlan
                            project={project}
                            projectId={project.id}
                            apartments={apartments.filter(apt =>
                              selectedFloorForPlan !== null ? apt.floor_number === selectedFloorForPlan : true
                            )}
                            onApartmentSelect={openApartmentDetails}
                            selectedFloorNumber={selectedFloorForPlan ?? undefined}
                            visibleFields={fieldSettings.filter(field => field.is_visible)}
                          />
                        </div>

                        {/* Floor selector sidebar */}
                        <Suspense fallback={<Loader color={getThemeColor()} size="sm" className="mx-auto" />}>
                          <FloorSelector
                            selectedFloorForPlan={selectedFloorForPlan}
                            setSelectedFloorForPlan={setSelectedFloorForPlan}
                            getUniqueFloors={filters.getUniqueFloors}
                            themeColor={getThemeColor()}
                            apartments={apartments}
                            showOnlyAvailable={filters.showOnlyAvailable}
                            filteredApartments={filters.filteredApartments}
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
};

export default ProjectApartmentSelector;
