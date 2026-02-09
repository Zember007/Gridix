import {lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Sheet, SheetContent, useIsMobile,} from "@gridix/ui";
import {supabase} from "@gridix/utils/api";
import {Project, useProject} from '@/entities/project/queries/useProjects';
import {Apartment} from '@/entities/apartment/model/types';
import {useLanguage} from '@gridix/utils/react';
import {useFields} from '@/hooks/useFields';
import ApartmentFloorPlan from '../apartment/ApartmentFloorPlan';
import BuildingFacadeView from '@/features/visualization/buildingFacade/ui/BuildingFacadeView';
import {BuildingFloor, FacadeSettings} from '@/features/visualization/buildingFacade/model/types';
import {useFavorites} from '@/hooks/useFavorites';
import {useAuth} from '@/contexts/AuthContext';
import {useProjectFilters} from './hooks/useProjectFilters';
import {ChessView} from './views/ChessView';
import {LayoutGallery} from './layouts/LayoutGallery';
import LoaderView from './views/LoaderView';
import {useApartmentsData} from './hooks/useApartmentsData';
import {useBuildingImage} from './hooks/useBuildingImage';
import {useFloorPolygons} from './hooks/useFloorPolygons';
import {useWidgetScroll} from './hooks/useWidgetScroll';
import {useFieldHelpers} from './hooks/useFieldHelpers';
import {useSubscriptionStatus} from './hooks/useSubscriptionStatus';
import {SubscriptionAlert} from './SubscriptionAlert';
import {ProjectHeader} from './ProjectHeader';
import {ProjectSidePanel, type SidePanelState} from './ProjectSidePanel';
import Spinner from "@/shared/ui/Spinner.tsx";

interface ProjectApartmentSelectorProps {
    projectId: string;
    isWidget?: boolean;
    showFullProjectInWidget?: boolean;
}

interface ProjectFacade {
    id: string;
    project_id: string;
    name: string;
    image_url: string | null;
    order_index: number;
}

// Lazy load components at module level (outside component)
const ApartmentDetailsPage = lazy(() => import('@/pages/ApartmentDetailsPage'))
const InteractiveProjectsMap = lazy(() => import('@/components/visualization/InteractiveProjectsMap'))
const FavoritesTab = lazy(() => import('../FavoritesTab'))
const ListView = lazy(() => import('./views/ListView').then(module => ({default: module.ListView})))
const FloorSelector = lazy(() => import('./FloorSelector').then(module => ({default: module.FloorSelector})))

const enableSidePanel = true;

const ProjectApartmentSelector = ({
                                      projectId,
                                      isWidget = false,
                                  }: ProjectApartmentSelectorProps) => {
    const {t, language} = useLanguage();
    const isMobile = useIsMobile();
    const {project} = useProject(projectId);
    const {fields: fieldSettings} = useFields(project?.id || null);
    const {favoritesCount} = useFavorites(project?.id || undefined);
    const {user} = useAuth();

    // State
    const [viewMode, setViewMode] = useState<'facade' | 'floor-plan' | 'list' | 'map' | 'favorites' | 'chess'>('facade');
    // const [listViewMode, setListViewMode] = useState<'list' | 'grid'>('grid'); // Unused now
    const [selectedFloorForPlan, setSelectedFloorForPlan] = useState<number | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
    const [isApartmentModalOpen, setIsApartmentModalOpen] = useState(false);
    const [isApartmentDetailsOpen, setIsApartmentDetailsOpen] = useState(false); // New state for slide-over
    const [sidePanelOpen, setSidePanelOpen] = useState(false);
    const [sidePanelState, setSidePanelState] = useState<SidePanelState | null>(null);

    const filtersRef = useRef<HTMLDivElement>(null);

    const {
        apartments,
        setApartments,
        apartmentsLoaded,
        preloadedLayoutPhotosByRooms,
    } = useApartmentsData({projectId: project?.id});

    // Facades (runtime facade switching)
    const [facades, setFacades] = useState<ProjectFacade[]>([]);
    const [facadesLoaded, setFacadesLoaded] = useState(false);
    const [activeFacadeIndex, setActiveFacadeIndex] = useState(0);

    const activeFacade = useMemo(
        () => facades[activeFacadeIndex] ?? facades[0] ?? null,
        [facades, activeFacadeIndex],
    );
    const activeFacadeImageUrl = activeFacade?.image_url ?? project?.building_image_url ?? null;

    const {buildingImageLoaded, buildingImageNaturalSize} = useBuildingImage(activeFacadeImageUrl);

    // Facade data (floors + settings), loaded only when facade view is active
    const [floorsByFacadeId, setFloorsByFacadeId] = useState<Record<string, BuildingFloor[]>>({});
    const [floorsAllLoading, setFloorsAllLoading] = useState(false);
    const [floorsAllLoaded, setFloorsAllLoaded] = useState(false);

    const [facadeSettings, setFacadeSettings] = useState<FacadeSettings | null>(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);

    const shouldLoadFacadeData =
        viewMode === 'facade' &&
        !!project?.id &&
        !!activeFacadeImageUrl;

    const {containerRef, scrollWidgetToTop} = useWidgetScroll(isWidget, [viewMode]);

    // Load facades only when facade view is active
    useEffect(() => {
        const loadFacades = async () => {
            if (!project?.id) {
                setFacades([]);
                setFacadesLoaded(false);
                return;
            }
            try {
                const {data, error} = await supabase
                    // Types are updated later; keep cast minimal for now.
                    .from('project_facades')
                    .select('*')
                    .eq('project_id', project.id)
                    .order('order_index');
                if (error) throw error;

                const list = (data as unknown as ProjectFacade[]) ?? [];
                setFacades(list);
                setFacadesLoaded(true);

                // Clamp active index
                setActiveFacadeIndex((prev) => {
                    if (list.length === 0) return 0;
                    if (prev < 0) return 0;
                    if (prev >= list.length) return 0;
                    return prev;
                });
            } catch (e) {
                console.error('Error loading project facades:', e);
                setFacades([]);
                setFacadesLoaded(true);
            } finally {
                // no-op
            }
        };

        if (viewMode === 'facade' && !!project?.id && !facadesLoaded) {
            void loadFacades();
        }
    }, [viewMode, project?.id, facadesLoaded]);

    // Load ALL building floors for ALL facades only once when facade view is active.
    useEffect(() => {
        const loadAllBuildingFloors = async () => {
            if (!project?.id) {
                setFloorsByFacadeId({});
                setFloorsAllLoaded(false);
                return;
            }

            try {
                setFloorsAllLoading(true);
                const {data, error} = await supabase
                    .from('building_floors')
                    .select('*')
                    .eq('project_id', project.id)
                    .order('floor_number');

                if (error) throw error;

                const rows: Array<{
                    id: string;
                    floor_number: number;
                    polygon: unknown;
                    color: string;
                    facade_id: string | null;
                }> = (data || []) as unknown as Array<{
                    id: string;
                    floor_number: number;
                    polygon: unknown;
                    color: string;
                    facade_id: string | null;
                }>;

                const grouped: Record<string, BuildingFloor[]> = {};
                rows.forEach((floor) => {
                    const key = floor.facade_id ?? '__legacy__';
                    const entry: BuildingFloor = {
                        id: floor.id,
                        floor_number: floor.floor_number,
                        polygon: Array.isArray(floor.polygon)
                            ? (floor.polygon as { x: number; y: number }[])
                            : [],
                        color: floor.color,
                    };
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(entry);
                });

                setFloorsByFacadeId(grouped);
                setFloorsAllLoaded(true);
            } catch (error) {
                console.error('Error loading building floors:', error);
                setFloorsByFacadeId({});
                setFloorsAllLoaded(true);
            } finally {
                setFloorsAllLoading(false);
            }
        };

        if (shouldLoadFacadeData && !floorsAllLoaded) {
            void loadAllBuildingFloors();
        }
    }, [shouldLoadFacadeData, project?.id, floorsAllLoaded]);

    const buildingFloors = useMemo(() => {
        if (!activeFacade?.id) return [];
        return floorsByFacadeId[activeFacade.id] ?? [];
    }, [activeFacade?.id, floorsByFacadeId]);

    // (per-facade floors fetch removed; we load all once and switch from cache)

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
                const {data, error} = await supabase
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
                        colors: {building: '#3b82f6'},
                        opacity: {normal: 0.4, hover: 0.7},
                        hoverEffects: {glow: true, colorChange: true, opacityChange: true},
                        display: {showNumbers: true, showTooltip: false},
                    });
                }
                setSettingsLoaded(true);
            } catch (e) {
                console.error('Error loading facade settings:', e);
                setFacadeSettings({
                    colors: {building: '#3b82f6'},
                    opacity: {normal: 0.4, hover: 0.7},
                    hoverEffects: {glow: true, colorChange: true, opacityChange: true},
                    display: {showNumbers: true, showTooltip: false},
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
            : {apartments}
    );

    const {getFieldLabel, getCustomFieldValue, formatFieldValue, formatPrice} = useFieldHelpers({
        language,
        t,
        convertPrice: filters.convertPrice,
        projectCurrency: project?.currency,
        selectedCurrency: filters.selectedCurrency,
        selectedType: filters.selectedType,
    });

    const themeColor = (project as unknown as Record<string, unknown>)?.theme_color as string || '#000000';

    const facadeDataLoaded =
        !shouldLoadFacadeData || (floorsAllLoaded && settingsLoaded && facadesLoaded);

    const getBaseDomain = async () => {

        // Получаем текущий домен
        const currentHostname = window.location.hostname;

        // Получаем домены проекта из project_domains
        const {data: projectDomains} = await supabase
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

        // New Slide-Over Logic
        setSelectedApartment(apartment);
        setIsApartmentDetailsOpen(true);

        // Update URL without reload
        try {
            // Construct URL (reusing logic mostly)
            const projectPath = project?.slug ? project.slug : `id/${project?.id || projectId}`;
            const base = `/${language}/project/${projectPath}/apartment/${apartment.apartment_number}`;

            const currentUrl = new URL(window.location.href);
            // Keep existing query params
            const newUrl = new URL(base, window.location.origin);
            currentUrl.searchParams.forEach((value, key) => {
                newUrl.searchParams.set(key, value);
            });

            // Add tracking state
            window.history.pushState({apartmentId: apartment.id}, '', newUrl.toString());

        } catch (e) {
            console.error('Error updating URL', e);
        }
    };

    // Handle browser back button
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // If we navigate back, close the drawer
            // We can check event.state but generally just closing is safe if we pushed state for the drawer
            setIsApartmentDetailsOpen(false);
            // Optional: setSelectedApartment(null) after animation or immediately
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const handleCloseApartmentDetails = useCallback(() => {
        // If currently open and we have history, go back.
        // This assumes we pushed state securely.
        // If user interacts with browser back, popstate handles it.
        // If user clicks Close button, we call history.back().
        window.history.back();
    }, []);

    const openFloorPreview = (floorNumber: number) => {
        setSelectedFloorForPlan(floorNumber);

        if (!enableSidePanel) {
            // Switching to floor plan can suspend (lazy chunks). Wrap in transition to avoid React #426 in production.
            startTransition(() => {
                setViewMode('floor-plan');
            });
            return;
        }
        setSidePanelState({kind: 'floor', floorNumber});
        setSidePanelOpen(true);
    };

    const openApartmentPreview = (apartment: Apartment) => {
        // Widget keeps its modal-based UX
        if (isWidget || !enableSidePanel || isMobile) {
            void openApartmentDetails(apartment);
            return;
        }
        setSidePanelState({kind: 'apartment', apartment});
        setSidePanelOpen(true);
    };

    const openFloorPlanFromPanel = (floorNumber: number) => {
        setSelectedFloorForPlan(floorNumber);
        // Switching view can suspend (lazy chunks). Wrap in transition to avoid React #426 in production.
        startTransition(() => {
            setViewMode('floor-plan');
            setSidePanelOpen(false);
        });
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

    // Persistence for agent_id
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const urlAgentId = params.get('agent_id');

        if (urlAgentId && projectId) {
            localStorage.setItem(`agent_context:${projectId}`, JSON.stringify({
                agent_id: urlAgentId,
                set_at: new Date().toISOString(),
                source: 'link'
            }));
        }
    }, [projectId]);


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

    const {isSubscriptionInactive, isOwner} = useSubscriptionStatus({project, user});

    const loaderBlock = <div className="grid h-full w-full place-items-center absolute inset-0">
        <Spinner size="md"  color={themeColor}/>
    </div>

    // If widget mode and apartment is selected, show apartment details
    if (isWidget && isApartmentModalOpen && selectedApartment) {
        return (
            <Suspense fallback={loaderBlock}>
                <ApartmentDetailsPage
                    onClose={() => {
                        setIsApartmentModalOpen(false);
                        setSelectedApartment(null);
                    }}
                    useId={true} apartmentIdProp={selectedApartment.id} projectIdProp={projectId}/>
            </Suspense>
        );
    }


    return (
        <div ref={containerRef} className="min-h-screen bg-white flex flex-col relative select-none">
            <LoaderView color={themeColor} loading={isInitialLoading}/>
            <SubscriptionAlert
                isSubscriptionInactive={isSubscriptionInactive}
                isOwner={!!isOwner}
                language={language}
            />

            {project && (
                <>
                    {/* Layout: left column (header + content) + right column (side panel) */}
                    <div className="flex grow min-h-0">
                        <div className="flex flex-col flex-1 min-w-0 min-h-0">
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
                                themeColor={themeColor}
                                filters={filters}
                                isFiltersOpen={isFiltersOpen}
                                setIsFiltersOpen={setIsFiltersOpen}
                            />

                            {/* Main content */}
                            <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
                                {showContent ? (
                                    <>
                                        {viewMode === 'list' ? (
                                            <Suspense fallback={loaderBlock}>
                                                <ListView
                                                    filteredApartments={filters.filteredApartments}
                                                    listViewMode="list"
                                                    setListViewMode={(mode) => {
                                                        if (mode === 'grid') setViewMode('chess');
                                                        else setViewMode('list');
                                                    }}
                                                    hideViewToggle={true}
                                                    selectedType={filters.selectedType}
                                                    setSelectedType={filters.setSelectedType}
                                                    openApartmentDetails={openApartmentPreview}
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
                                                    themeColor={themeColor}
                                                />
                                            </Suspense>
                                        ) : viewMode === 'chess' ? (
                                            <Suspense fallback={loaderBlock}>
                                                <ChessView
                                                    project={project as Project}
                                                    apartments={filters.filteredApartments}
                                                    onApartmentSelect={openApartmentPreview}
                                                    onOpenFloorPlan={openFloorPlanFromPanel}
                                                    themeColor={themeColor}
                                                    language={language}
                                                />
                                            </Suspense>
                                        ) : viewMode === 'map' ? (
                                            <Suspense fallback={loaderBlock}>
                                                <InteractiveProjectsMap
                                                    project={project}
                                                    onProjectSelect={() => {
                                                        setViewMode('list');
                                                    }}
                                                />
                                            </Suspense>
                                        ) : viewMode === 'favorites' ? (
                                            <div className="container mx-auto py-8 grow">
                                                <Suspense fallback={loaderBlock}>
                                                    <FavoritesTab
                                                        fieldVisible={fieldSettings.filter(field => field.is_visible).map(field => field.field_name)}
                                                        handleViewApartment={openApartmentPreview}
                                                        projectId={project.id}
                                                        projectCurrency={project?.currency}
                                                    />
                                                </Suspense>
                                            </div>
                                        ) : (
                                            // Facade and Floor Plan views
                                            <div className="relative flex-1 min-w-0 h-full">
                                                {viewMode === 'facade' ? (
                                                    // Building facade view with interactive floor polygons
                                                    <div
                                                        className="w-full bg-white h-full relative overflow-hidden flex flex-col">
                                                        <div className="flex-1 min-h-0 relative overflow-hidden">
                                                            <BuildingFacadeView
                                                                themeColor={themeColor}
                                                                projectId={project.id}
                                                                project={project}
                                                                imageUrl={activeFacadeImageUrl}
                                                                apartments={filters.filteredApartments}
                                                                onFloorSelect={floor => {
                                                                    openFloorPreview(floor);
                                                                }}
                                                                onApartmentSelect={openApartmentPreview}
                                                                filtersRef={filtersRef}
                                                                externalImageLoaded={buildingImageLoaded}
                                                                externalImageNaturalSize={buildingImageNaturalSize}
                                                                showOnlyAvailable={filters.showOnlyAvailable}
                                                                visibleFields={fieldSettings.filter(field => field.is_visible)}
                                                                buildingFloors={buildingFloors}
                                                                facadeSettings={facadeSettings}
                                                                loading={floorsAllLoading || settingsLoading}
                                                                facades={facades.map((f) => ({id: f.id, name: f.name}))}
                                                                activeFacadeIndex={activeFacadeIndex}
                                                                onFacadeChange={(nextIndex) => setActiveFacadeIndex(nextIndex)}
                                                            />
                                                        </div>

                                                        {/* Layouts are shown under the facade (instead of a separate tab) */}
                                                        {project?.project_type !== 'object' && (
                                                            <LayoutGallery
                                                                apartments={filters.filteredApartments}
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
                                                                themeColor={themeColor}
                                                                visibleFields={fieldSettings.filter(field => field.is_visible)}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Floor plan view for specific floor with sidebar
                                                    <div className="w-full bg-white min-h-[600px] h-full">
                                                        <div
                                                            className={`flex ${isMobile ? 'flex-col' : 'flex-row'} h-full`}>
                                                            {/* Main floor plan area */}
                                                            <div className="flex-1 relative">
                                                                <ApartmentFloorPlan
                                                                    project={project}
                                                                    projectId={project.id}
                                                                    apartments={filters.filteredApartments.filter(apt =>
                                                                        selectedFloorForPlan !== null ? apt.floor_number === selectedFloorForPlan : true,
                                                                    )}
                                                                    onApartmentSelect={openApartmentPreview}
                                                                    selectedFloorNumber={selectedFloorForPlan ?? 0}
                                                                    visibleFields={fieldSettings.filter(field => field.is_visible)}
                                                                />
                                                            </div>

                                                            <Suspense fallback={null}>
                                                                <FloorSelector
                                                                    selectedFloorForPlan={selectedFloorForPlan}
                                                                    setSelectedFloorForPlan={setSelectedFloorForPlan}
                                                                    getUniqueFloors={filters.getUniqueFloors}
                                                                    themeColor={themeColor}
                                                                    apartments={apartments}
                                                                    showOnlyAvailable={filters.showOnlyAvailable}
                                                                    filteredApartments={filters.filteredApartments}
                                                                />
                                                            </Suspense>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                        )}
                                    </>
                                ) : null}
                            </div>
                        </div>

                        {/* Sidebar (desktop: pushes layout; mobile: remains overlay-ish) */}
                        {enableSidePanel && project && !isWidget && (
                            <>
                                {/* Desktop push panel */}
                                <div
                                    className={`hidden md:block bg-white border-l border-gray-100 shadow-2xl transition-[width] duration-300 ease-in-out`}
                                    style={{width: sidePanelOpen ? '35vw' : '0px'}}
                                >
                                    {sidePanelOpen && (
                                        <ProjectSidePanel
                                            open={sidePanelOpen}
                                            onOpenChange={(open) => {
                                                setSidePanelOpen(open);
                                                if (!open) setSidePanelState(null);
                                            }}
                                            state={sidePanelState}
                                            project={project as Project}
                                            language={language}
                                            themeColor={themeColor}
                                            t={t as unknown as (key: string, options?: Record<string, unknown>) => unknown}
                                            preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
                                            filteredApartments={filters.filteredApartments}
                                            onOpenApartmentDetails={(apt) => void openApartmentDetails(apt)}
                                            onOpenFloorPlan={openFloorPlanFromPanel}
                                        />
                                    )}
                                </div>

                                {/* Mobile overlay panel */}
                                <div
                                    className={`md:hidden fixed right-0 top-0 h-full bg-white border-l border-gray-100 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${sidePanelOpen ? 'translate-x-0' : 'translate-x-full'
                                    }`}
                                    style={{width: '100vw'}}
                                >
                                    {sidePanelOpen && (
                                        <ProjectSidePanel
                                            open={sidePanelOpen}
                                            onOpenChange={(open) => {
                                                setSidePanelOpen(open);
                                                if (!open) setSidePanelState(null);
                                            }}
                                            state={sidePanelState}
                                            project={project as Project}
                                            language={language}
                                            themeColor={themeColor}
                                            t={t as unknown as (key: string, options?: Record<string, unknown>) => unknown}
                                            preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
                                            filteredApartments={filters.filteredApartments}
                                            onOpenApartmentDetails={(apt) => void openApartmentDetails(apt)}
                                            onOpenFloorPlan={openFloorPlanFromPanel}
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/*
              Note: We removed the conditional rendering logic inside ProjectSidePanel usage or wrapper? 
              The wrapper `div` now handles the visibility via `translate-x`.
              One detail: if `sidePanelState` is null, SidePanel might crash or show empty.
              We should probably keep rendering SidePanel but maybe maintain the last state if closing?
              For now, let's assume SidePanel handles null state gracefully or we conditionally render CONTENT inside SidePanel, 
              but the drawer wrapper stays. 
              Actually, if `sidePanelOpen` is false, `translate-x-full` hides it. The content inside doesn't matter much visually.
              However, if we populate `sidePanelState` only when open, we are good.
             */}

                    </div>

                    {/* Slide-over Apartment Details */}
                    {!isWidget && (
                        <Sheet open={isApartmentDetailsOpen} onOpenChange={(open) => {
                            if (!open) handleCloseApartmentDetails();
                        }}>
                            <SheetContent side="right" noCloseButton
                                          className="p-0 w-full !max-w-full z-[60] overflow-y-auto">
                                {selectedApartment && (
                                    <Suspense
                                        fallback={loaderBlock}>
                                        <ApartmentDetailsPage
                                            useId={true}
                                            apartmentIdProp={selectedApartment.id}
                                            projectIdProp={project.id}
                                            onClose={handleCloseApartmentDetails}
                                        />
                                    </Suspense>
                                )}
                            </SheetContent>
                        </Sheet>
                    )}
                </>
            )}


        </div>
    );
};


export default ProjectApartmentSelector;
