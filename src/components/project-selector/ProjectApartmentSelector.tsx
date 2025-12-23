import { useState, useEffect, useMemo, lazy, Suspense, useRef, useCallback } from 'react';
import { supabase } from '@/shared/api/supabase';
import { useProject } from '@/entities/project/queries/useProjects';
import { Loader } from '@/shared/ui/loader';
import { Apartment } from '@/entities/apartment/model/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFields } from '@/hooks/useFields';
import ApartmentFloorPlan from '../apartment/ApartmentFloorPlan';
import BuildingFacadeView from '@/features/visualization/buildingFacade/ui/BuildingFacadeView';
import { BuildingFloor, FacadeSettings } from '@/features/visualization/buildingFacade/model/types';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';

import { useProjectFilters } from './hooks/useProjectFilters';
import { LayoutGallery } from './layouts/LayoutGallery';
import { Project } from '@/entities/project/queries/useProjects';
import LoaderView from './views/LoaderView';
import { useApartmentsData } from './hooks/useApartmentsData';
import { useBuildingImage } from './hooks/useBuildingImage';
import { useFloorPolygons } from './hooks/useFloorPolygons';
import { useWidgetScroll } from './hooks/useWidgetScroll';
import { useFieldHelpers } from './hooks/useFieldHelpers';
import { useSubscriptionStatus } from './hooks/useSubscriptionStatus';
import { SubscriptionAlert } from './SubscriptionAlert';
import { ProjectHeader } from './ProjectHeader';

interface ProjectApartmentSelectorProps {
  projectId: string;
  isWidget?: boolean;
  showFullProjectInWidget?: boolean;
}

// Lazy load components at module level (outside component)
const ApartmentDetailsPage = lazy(() => import('@/pages/ApartmentDetailsPage'))
const InteractiveProjectsMap = lazy(() => import('@/components/visualization/InteractiveProjectsMap'))
const FavoritesTab = lazy(() => import('../FavoritesTab'))
const ListView = lazy(() => import('./views/ListView').then(module => ({ default: module.ListView })))
const FloorSelector = lazy(() => import('./FloorSelector').then(module => ({ default: module.FloorSelector })))

const ProjectApartmentSelector = ({
  projectId,
  isWidget = false,
}: ProjectApartmentSelectorProps) => {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { project } = useProject(projectId);
  const { fields: fieldSettings } = useFields(project?.id || null);
  const { favoritesCount } = useFavorites(project?.id || undefined);
  const { user } = useAuth();

  // State
  const [viewMode, setViewMode] = useState<'facade' | 'floor-plan' | 'list' | 'map' | 'favorites'>('facade');
  const [listViewMode, setListViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedFloorForPlan, setSelectedFloorForPlan] = useState<number | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isDesktopFiltersExpanded, setIsDesktopFiltersExpanded] = useState(false);
  const [stagedPriceRange, setStagedPriceRange] = useState<number[] | null>(null);
  const [stagedAreaRange, setStagedAreaRange] = useState<number[] | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);

  const filtersRef = useRef<HTMLDivElement>(null);

  const {
    apartments,
    setApartments,
    apartmentsLoaded,
    preloadedLayoutPhotosByRooms,
  } = useApartmentsData({ projectId: project?.id });

  const { buildingImageLoaded, buildingImageNaturalSize } = useBuildingImage(
    project?.building_image_url,
  );

  // Facade data (floors + settings), loaded only when facade view is active
  const [buildingFloors, setBuildingFloors] = useState<BuildingFloor[]>([]);
  const [floorsLoading, setFloorsLoading] = useState(false);
  const [floorsLoaded, setFloorsLoaded] = useState(false);

  const [facadeSettings, setFacadeSettings] = useState<FacadeSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const shouldLoadFacadeData =
    viewMode === 'facade' &&
    !!project?.id &&
    !!project?.building_image_url;

  const { containerRef, scrollWidgetToTop } = useWidgetScroll(isWidget, [viewMode]);

  // Load building floors only when facade view is active
  useEffect(() => {
    const loadBuildingFloors = async () => {
      if (!project?.id) {
        setBuildingFloors([]);
        setFloorsLoaded(false);
        return;
      }

      try {
        setFloorsLoading(true);
        const { data, error } = await supabase
          .from('building_floors')
          .select('*')
          .eq('project_id', project.id)
          .order('floor_number');

        if (error) throw error;

        const processedFloors: BuildingFloor[] = (data || []).map((floor: {
          id: string;
          floor_number: number;
          polygon: unknown;
          color: string;
        }) => ({
          id: floor.id,
          floor_number: floor.floor_number,
          polygon: Array.isArray(floor.polygon)
            ? (floor.polygon as { x: number; y: number }[])
            : [],
          color: floor.color,
        }));

        setBuildingFloors(processedFloors);
        setFloorsLoaded(true);
      } catch (error) {
        console.error('Error loading building floors:', error);
        setBuildingFloors([]);
        setFloorsLoaded(true);
      } finally {
        setFloorsLoading(false);
      }
    };

    if (shouldLoadFacadeData && !floorsLoaded) {
      void loadBuildingFloors();
    }
  }, [shouldLoadFacadeData, project?.id, floorsLoaded]);

  // Load project-level facade settings only when facade view is active
  useEffect(() => {
    const loadSettings = async () => {
      if (!project?.id) {
        setFacadeSettings(null);
        setSettingsLoaded(false);
        return;
      }

      try {
        setSettingsLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select('polygon_settings_facade')
          .eq('id', project.id)
          .single();

        if (error) throw error;

        if (data && 'polygon_settings_facade' in data && data.polygon_settings_facade) {
          const s = data.polygon_settings_facade as Record<string, unknown>;
          setFacadeSettings({
            colors: {
              building: (s?.colors as Record<string, unknown>)?.building as string || '#3b82f6',
            },
            opacity: {
              normal:
                typeof (s?.opacity as Record<string, unknown>)?.normal === 'number'
                  ? (s.opacity as Record<string, unknown>).normal as number
                  : 0.4,
              hover:
                typeof (s?.opacity as Record<string, unknown>)?.hover === 'number'
                  ? (s.opacity as Record<string, unknown>).hover as number
                  : 0.7,
            },
            hoverEffects: {
              glow: !!(s?.hoverEffects as Record<string, unknown>)?.glow,
              colorChange: !!(s?.hoverEffects as Record<string, unknown>)?.colorChange,
              opacityChange: !!(s?.hoverEffects as Record<string, unknown>)?.opacityChange,
            },
            display: {
              showNumbers: !!(s?.display as Record<string, unknown>)?.showNumbers,
              showTooltip: !!(s?.display as Record<string, unknown>)?.showTooltip,
            },
          });
        } else {
          setFacadeSettings({
            colors: { building: '#3b82f6' },
            opacity: { normal: 0.4, hover: 0.7 },
            hoverEffects: { glow: true, colorChange: true, opacityChange: true },
            display: { showNumbers: true, showTooltip: false },
          });
        }
        setSettingsLoaded(true);
      } catch (e) {
        console.error('Error loading facade settings:', e);
        setFacadeSettings({
          colors: { building: '#3b82f6' },
          opacity: { normal: 0.4, hover: 0.7 },
          hoverEffects: { glow: true, colorChange: true, opacityChange: true },
          display: { showNumbers: true, showTooltip: false },
        });
        setSettingsLoaded(true);
      } finally {
        setSettingsLoading(false);
      }
    };

    if (shouldLoadFacadeData && !settingsLoaded) {
      void loadSettings();
    }
  }, [shouldLoadFacadeData, project?.id, settingsLoaded]);

  // Use filters hook
  const filters = useProjectFilters(
    project
      ? {
        apartments,
        project: project as unknown as { currency?: string; has_commercial?: boolean; has_parking?: boolean },
      }
      : { apartments }
  );

  const { getFieldLabel, getCustomFieldValue, formatFieldValue, formatPrice } = useFieldHelpers({
    language,
    t,
    convertPrice: filters.convertPrice,
    projectCurrency: project?.currency,
    selectedCurrency: filters.selectedCurrency,
    selectedType: filters.selectedType,
  });

  const getThemeColor = () => {
    return (project as unknown as Record<string, unknown>)?.theme_color as string || '#000000';
  };

  const facadeDataLoaded =
    !shouldLoadFacadeData || (floorsLoaded && settingsLoaded);

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
      scrollWidgetToTop();
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

  // Full project page is now handled by separate FloatingProjectButton in widget context

  useFloorPolygons({
    projectId: project?.id,
    viewMode,
    selectedFloorForPlan,
    setApartments,
  });

  // Set default floor when apartments load
  useEffect(() => {
    if (apartments.length > 0 && selectedFloorForPlan === null) {
      const uniqueFloors = filters.getUniqueFloors();
      if (uniqueFloors.length > 0 && uniqueFloors[0] !== undefined) {
        setSelectedFloorForPlan(uniqueFloors[0]);
      }
    }
  }, [apartments, filters, selectedFloorForPlan]);



  const getVisibleFields = useCallback(
    () =>
      fieldSettings
        .filter(field => field.is_visible)
        .sort((a, b) => a.sort_order - b.sort_order),
    [fieldSettings],
  );

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



  // Show incremental loading - don't block UI completely
  const isInitialLoading = useMemo(
    () => !apartmentsLoaded || !project || (viewMode === 'facade' && !facadeDataLoaded),
    [apartmentsLoaded, project, viewMode, facadeDataLoaded],
  );
  const showContent = apartmentsLoaded; // Show content as soon as apartments are loaded

  const { isSubscriptionInactive, isOwner } = useSubscriptionStatus({ project, user });

  // If widget mode and apartment is selected, show apartment details
  if (isWidget && isApartmentModalOpen && selectedApartment) {
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader color={getThemeColor()} size="lg" className="mx-auto" />
        </div>
      }>
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
    <div ref={containerRef} className="min-h-screen bg-white flex flex-col relative">
      <LoaderView color={getThemeColor()} loading={isInitialLoading} />
      <SubscriptionAlert
        isSubscriptionInactive={isSubscriptionInactive}
        isOwner={!!isOwner}
        language={language}
      />

      {project && (
        <>
          <ProjectHeader
            filtersRef={filtersRef}
            project={project as Project}
            isWidget={isWidget}
            isMobile={isMobile ?? false}
            viewMode={viewMode}
            setViewMode={setViewMode}
            favoritesCount={favoritesCount}
            mapVisible={!!project?.latitude && !!project?.longitude}
            projectType={project?.project_type as 'building' | 'object' | null}
            themeColor={getThemeColor()}
            filters={filters}
            isFiltersOpen={isFiltersOpen}
            setIsFiltersOpen={setIsFiltersOpen}
            isDesktopFiltersExpanded={isDesktopFiltersExpanded}
            setIsDesktopFiltersExpanded={setIsDesktopFiltersExpanded}
            stagedPriceRange={stagedPriceRange}
            setStagedPriceRange={setStagedPriceRange}
            stagedAreaRange={stagedAreaRange}
            setStagedAreaRange={setStagedAreaRange}
          />

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
                    isMobile={isMobile ?? false}
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
                      projectId={project.id}
                      projectCurrency={project?.currency}
                    />
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
                            themeColor={getThemeColor()}
                            projectId={project.id}
                            project={project}
                            apartments={filters.filteredApartments}
                            onFloorSelect={floor => {
                              setSelectedFloorForPlan(floor);
                              setViewMode('floor-plan');
                            }}
                            onApartmentSelect={openApartmentDetails}
                            filtersRef={filtersRef}
                            externalImageLoaded={buildingImageLoaded}
                            externalImageNaturalSize={buildingImageNaturalSize}
                            showOnlyAvailable={filters.showOnlyAvailable}
                            visibleFields={fieldSettings.filter(field => field.is_visible)}
                            buildingFloors={buildingFloors}
                            facadeSettings={facadeSettings}
                            loading={floorsLoading || settingsLoading}
                          />

                          {/* Layout gallery below facade when not expanded - hide for project_type = object */}
                          {project?.project_type !== 'object' && (
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
                              isMobile={isMobile ?? false}
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
                                  selectedFloorForPlan !== null ? apt.floor_number === selectedFloorForPlan : true,
                                )}
                                onApartmentSelect={openApartmentDetails}
                                selectedFloorNumber={selectedFloorForPlan ?? 0}
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
        </>
      )}
    </div>
  );
};

export default ProjectApartmentSelector;
