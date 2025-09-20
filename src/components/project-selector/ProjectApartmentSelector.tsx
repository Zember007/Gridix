import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProject } from '@/hooks/useProjects';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Building2, SlidersHorizontal } from 'lucide-react';
import { Apartment, normalizeApartmentData } from '@/types/apartment';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFields } from '@/hooks/useFields';
import { Language } from '@/lib/language-utils';
import ApartmentFloorPlan from '../apartment/ApartmentFloorPlan';
import BuildingFacadeView from '../visualization/BuildingFacadeView';
import InteractiveProjectsMap from '../visualization/InteractiveProjectsMap';
import FavoritesTab from '../FavoritesTab';
import { useFavorites } from '@/hooks/useFavorites';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';

// Import new components
import { useProjectFilters } from './hooks/useProjectFilters';
import { ViewModeButtons } from './ViewModeButtons';
import { CompactFilters } from './filters/CompactFilters';
import { ExpandedFilters } from './filters/ExpandedFilters';
import { MobileFilters } from './filters/MobileFilters';
import { LayoutGallery } from './layouts/LayoutGallery';
import { ListView } from './views/ListView';

interface ProjectApartmentSelectorProps {
  projectId: string;
}

const ProjectApartmentSelector = ({ projectId }: ProjectApartmentSelectorProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { project } = useProject(projectId);
  const { fields: fieldSettings } = useFields(projectId);
  const { favoritesCount } = useFavorites(projectId);

  // State
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [apartmentsLoaded, setApartmentsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'facade' | 'floor-plan' | 'list' | 'map' | 'favorites'>('facade');
  const [listViewMode, setListViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedFloorForPlan, setSelectedFloorForPlan] = useState<number | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isDesktopFiltersExpanded, setIsDesktopFiltersExpanded] = useState(false);
  const [preloadedLayoutPhotosByRooms, setPreloadedLayoutPhotosByRooms] = useState<Record<string, { id: string; image_url: string; description?: string; order_index: number; type: 'layout' }[]>>({});

  const filtersRef = useRef<HTMLDivElement>(null);
  const loadedPolygonsForFloorsRef = useRef<Set<number>>(new Set());

  // Use filters hook
  const filters = useProjectFilters({ apartments, project });

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

  const openApartmentDetails = (apartment: Apartment) => {
    const url = `/${language}/project/${projectId}/apartment/${apartment.id}`;
    window.open(url, '_blank');
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('ru-RU').format(Math.round(price));

  // Load apartments
  const loadApartments = useCallback(async () => {
    if (apartmentsLoaded) return;

    try {
      const { data, error } = await supabase
        .from('apartments')
        .select('id, apartment_number, floor_number, rooms, area, price, status, project_id, created_at, updated_at, floor_plan_id, custom_fields, type')
        .eq('project_id', projectId);

      if (error) throw error;

      const normalizedApartments = (data || []).map(normalizeApartmentData);
      setApartments(normalizedApartments);
      setApartmentsLoaded(true);
    } catch (error) {
      console.error('Error loading apartments:', error);
    }
  }, [projectId, apartmentsLoaded]);

  useEffect(() => {
    if (projectId) {
      loadApartments();
    }
  }, [projectId, loadApartments]);

  // Set default floor when apartments load
  useEffect(() => {
    if (apartments.length > 0 && selectedFloorForPlan === null) {
      const uniqueFloors = filters.getUniqueFloors();
      if (uniqueFloors.length > 0) {
        setSelectedFloorForPlan(uniqueFloors[0]);
      }
    }
  }, [apartments, filters, selectedFloorForPlan]);

  // Preload layout photos
  useEffect(() => {
    const preloadLayoutPhotos = async () => {
      if (!projectId || apartments.length === 0) return;
      
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

  // Load polygons for floor plan view
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

  // Group apartments by floor for grid mode
  const groupApartmentsByFloor = useCallback(() => {
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
      apartments: grouped[floor].sort((a, b) => {
        if (a.apartment_number && b.apartment_number) {
          return a.apartment_number.localeCompare(b.apartment_number);
        }
        return a.id.localeCompare(b.id);
      })
    }));
  }, [filters]);

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

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Top header bar - always visible */}
      <div ref={filtersRef} className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-4">
          {/* View mode buttons */}
          <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} mb-4`}>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 truncate`}>{project.name}</h1>
            <div className={`flex ${isMobile ? 'justify-center' : 'items-center'} gap-1 md:gap-2`}>
              <ViewModeButtons
                viewMode={viewMode}
                setViewMode={setViewMode}
                favoritesCount={favoritesCount}
                isMobile={isMobile}
                themeColor={getThemeColor()}
              />

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
                      <MobileFilters
                        {...filters}
                        getUniqueRoomCounts={filters.getUniqueRoomCounts}
                        getUniqueFloors={filters.getUniqueFloors}
                        project={project}
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
          {!isMobile && (
            <div className="space-y-4">
              {/* Compact filters row */}
              <div className="flex items-center justify-between">
                <CompactFilters
                  {...filters}
                  getUniqueRoomCounts={filters.getUniqueRoomCounts}
                  getUniqueFloors={filters.getUniqueFloors}
                  project={project}
                  viewMode={viewMode}
                  themeColor={getThemeColor()}
                />
              </div>

              {/* Expanded filters - animated */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isDesktopFiltersExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pt-4 border-t border-gray-200">
                  <ExpandedFilters
                    {...filters}
                    formatPrice={formatPrice}
                    themeColor={getThemeColor()}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'list' ? (
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
      ) : viewMode === 'map' ? (
        <InteractiveProjectsMap
          project={project ? { ...project, min_price: null } : undefined}
          onProjectSelect={() => {
            setViewMode('list');
          }}
        />
      ) : viewMode === 'favorites' ? (
        <div className="container mx-auto px-4 md:px-6 py-8 grow">
          <FavoritesTab projectId={projectId} projectCurrency={project?.currency} />
        </div>
      ) : (
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
                    apartments={filters.filteredApartments}
                    onFloorSelect={(floor) => {
                      setSelectedFloorForPlan(floor);
                      setViewMode('floor-plan');
                    }}
                    onApartmentSelect={openApartmentDetails}
                    filtersRef={filtersRef}
                  />

                  {/* Layout gallery below facade when not expanded */}
                  <LayoutGallery
                    apartments={apartments}
                    selectedRooms={filters.selectedRooms}
                    selectedType={filters.selectedType}
                    setSelectedRooms={filters.setSelectedRooms}
                    setSelectedType={filters.setSelectedType}
                    setViewMode={setViewMode}
                    getUniqueRoomCounts={filters.getUniqueRoomCounts}
                    preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
                    project={project}
                    formatPrice={formatPrice}
                    selectedCurrency={filters.selectedCurrency}
                    isMobile={isMobile}
                    themeColor={getThemeColor()}
                  />
                </div>
              ) : (
                // Floor plan view for specific floor with sidebar
                <div className="w-full bg-white min-h-[600px]">
                  <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full`}>
                    {/* Main floor plan area */}
                    <div className="flex-1 relative">
                      <ApartmentFloorPlan
                        projectId={projectId}
                        project={project}
                        apartments={filters.filteredApartments.filter(apt =>
                          selectedFloorForPlan !== null ? apt.floor_number === selectedFloorForPlan : true
                        )}
                        onApartmentSelect={openApartmentDetails}
                        selectedFloorNumber={selectedFloorForPlan}
                      />
                    </div>
                    
                    {/* Floor selector sidebar */}
                    <div className={`${isMobile ? 'h-20 w-full border-t border-l-0' : 'w-32 border-l'} bg-gradient-to-b from-gray-50 to-gray-100 border-gray-200 shadow-inner flex ${isMobile ? 'flex-row' : 'flex-col'} items-center justify-center p-4`}>
                      <div className={`flex ${isMobile ? 'flex-row items-center gap-4 w-full' : 'flex-col items-center gap-3 h-full'}`}>
            
                        
                        {/* Floor Carousel */}
                        <div className={`${isMobile ? 'flex-1 flex items-center justify-center min-h-0 py-2' : 'flex-1 flex flex-col items-center justify-center min-h-0 py-10'}`}>
                          <div className={`${isMobile ? ' w-full max-w-xs' : 'w-24 h-full'} relative`}>
                            <Carousel 
                              className="w-full h-full "
                              orientation={isMobile ? "horizontal" : "vertical"}
                              opts={{
                                align: "center",
                                loop: filters.getUniqueFloors().length > 3,
                              }}
                            >
                              <div className={`${isMobile ? ' w-full' : 'w-24 h-full'} shadow-xl border-2 border-white rounded-2xl bg-white backdrop-blur-sm`}>
                                <CarouselContent className={`h-full ${isMobile ? '' : 'flex-col'}`}>
                                  {filters.getUniqueFloors().map((floor, index) => (
                                    <CarouselItem key={floor} className={`${isMobile ? 'basis-1/3' : 'basis-1/3'} flex items-center justify-center`}>
                                      <button
                                        className={`w-full ${isMobile ? 'h-full' : 'h-12'} flex items-center justify-center text-lg font-semibold rounded-xl transition-colors ${
                                          selectedFloorForPlan === floor
                                            ? 'text-white'
                                            : 'hover:bg-gray-100 text-gray-700'
                                        }`}
                                        style={selectedFloorForPlan === floor ? { backgroundColor: getThemeColor() } : {}}
                                        onClick={() => setSelectedFloorForPlan(floor)}
                                      >
                                        {floor}
                                      </button>
                                    </CarouselItem>
                                  ))}
                                </CarouselContent>
                              </div>
                              
                              {/* Navigation buttons */}
                              {filters.getUniqueFloors().length > 3 && (
                                <>
                                  {isMobile ? (
                                    <>
                                      <CarouselPrevious className="-left-12 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
                                      <CarouselNext className="-right-12 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
                                    </>
                                  ) : (
                                    <>
                                      <CarouselPrevious className="-top-12 left-1/2 -translate-x-1/2 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
                                      <CarouselNext className="-bottom-12 left-1/2 -translate-x-1/2 h-8 w-8 shadow-lg border-2 border-white bg-white/90 backdrop-blur-sm hover:bg-white opacity-80 hover:opacity-100 transition-all" />
                                    </>
                                  )}
                                </>
                              )}
                            </Carousel>
                          </div>
                        </div>
                        
                   
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default ProjectApartmentSelector;
