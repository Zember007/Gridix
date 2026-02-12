import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { useIsMobile } from "@gridix/ui";
import { Project, useProject } from '@/entities/project/queries/useProjects';
import { Apartment } from '@/entities/apartment/model/types';
import { useLanguage } from '@gridix/utils/react';
import { useFields } from '@/hooks/useFields';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { FilterFieldKey, useProjectFilters } from './hooks/useProjectFilters';
import { ChessView } from './views/ChessView';
import LoaderView from './views/LoaderView';
import { useApartmentsData } from './hooks/useApartmentsData';
import { useBuildingImage } from './hooks/useBuildingImage';
import { useFloorPolygons } from './hooks/useFloorPolygons';
import { useWidgetScroll } from './hooks/useWidgetScroll';
import { useFieldHelpers } from './hooks/useFieldHelpers';
import { useSubscriptionStatus } from './hooks/useSubscriptionStatus';
import { useFacadeData } from './hooks/useFacadeData';
import { useUrlState } from './hooks/useUrlState';
import { useSelectorUIState } from './hooks/useSelectorUIState';
import { SubscriptionAlert } from './SubscriptionAlert';
import { ProjectHeader } from './ProjectHeader';
import Spinner from "@/shared/ui/Spinner.tsx";
// Section components
import { FacadeSection } from './sections/FacadeSection';
import { FloorPlanSection } from './sections/FloorPlanSection';
import { SidePanelWrapper } from './sections/SidePanelWrapper';
import { ApartmentDetailsSheet } from './sections/ApartmentDetailsSheet';
import { ProjectErrorBoundary } from './sections/ProjectErrorBoundary';

// Lazy load components at module level (outside component)
const ApartmentDetailsPage = lazy(() => import('@/pages/ApartmentDetailsPage'))
const InteractiveProjectsMap = lazy(() => import('@/components/visualization/InteractiveProjectsMap'))
const FavoritesTab = lazy(() => import('../FavoritesTab'))
const ListView = lazy(() => import('./views/ListView').then(module => ({ default: module.ListView })))

interface ProjectApartmentSelectorProps {
    projectId: string;
    isWidget?: boolean;
    showFullProjectInWidget?: boolean;
}


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

    // State (viewMode & floor are synced to URL search params)
    const { viewMode, setViewMode, selectedFloorForPlan, setSelectedFloorForPlan } = useUrlState();

    // UI state (panels, modals, facades) via reducer
    const ui = useSelectorUIState();

    const filtersRef = useRef<HTMLDivElement>(null);

    const visibleFilterFields = useMemo(() => {
        const filterFieldKeys: FilterFieldKey[] = ['type', 'rooms', 'floor', 'price', 'area', 'number', 'status'];
        return filterFieldKeys.reduce<Record<FilterFieldKey, boolean>>((acc, fieldKey) => {
            acc[fieldKey] = fieldSettings.find(field => field.field_name === fieldKey)?.is_visible ?? true;
            return acc;
        }, {
            type: true,
            rooms: true,
            floor: true,
            price: true,
            area: true,
            number: true,
            status: true,
        });
    }, [fieldSettings]);

    const {
        apartments,
        setApartments,
        apartmentsLoaded,
        preloadedLayoutPhotosByRooms,
    } = useApartmentsData({ projectId: project?.id });

    // Facade data (TanStack Query)
    const shouldLoadFacadeData = viewMode === 'facade' && !!project?.id;

    const {
        facades,
        facadesLoaded,
        floorsByFacadeId,
        floorsLoading: floorsAllLoading,
        floorsLoaded: floorsAllLoaded,
        facadeSettings,
        settingsLoading,
        settingsLoaded,
    } = useFacadeData({
        projectId: project?.id,
        enabled: shouldLoadFacadeData,
    });

    // Destructure stable callbacks for use in effects
    const { clampFacadeIndex, closeApartmentDetails: closeApartmentDetailsAction } = ui;
    useEffect(() => {
        if (facades.length > 0) {
            clampFacadeIndex(facades.length);
        }
    }, [facades.length, clampFacadeIndex]);

    const activeFacade = useMemo(
        () => facades[ui.activeFacadeIndex] ?? facades[0] ?? null,
        [facades, ui.activeFacadeIndex],
    );
    const activeFacadeImageUrl = activeFacade?.image_url ?? project?.building_image_url ?? null;

    const { buildingImageLoaded, buildingImageNaturalSize } = useBuildingImage(activeFacadeImageUrl);

    const buildingFloors = useMemo(() => {
        if (!activeFacade?.id) return [];
        return floorsByFacadeId[activeFacade.id] ?? [];
    }, [activeFacade?.id, floorsByFacadeId]);

    const { containerRef, scrollWidgetToTop } = useWidgetScroll(isWidget, [viewMode]);

    // ── Filters ──

    const filters = useProjectFilters({
        apartments,
        project: project ?? undefined,
        visibleFilterFields,
    });

    const { getFieldLabel, getCustomFieldValue, formatFieldValue, formatPrice } = useFieldHelpers({
        language,
        t,
        convertPrice: filters.convertPrice,
        projectCurrency: project?.currency,
        selectedCurrency: filters.selectedCurrency,
        selectedType: filters.selectedType,
    });

    // ── Computed values ──

    const themeColor = project?.theme_color ?? '#000000';

    const facadeDataLoaded =
        !shouldLoadFacadeData || (floorsAllLoaded && settingsLoaded && facadesLoaded);

    const visibleFields = useMemo(
        () =>
            fieldSettings
                .filter(field => field.is_visible)
                .sort((a, b) => a.sort_order - b.sort_order),
        [fieldSettings],
    );

    const getVisibleFields = useCallback(() => visibleFields, [visibleFields]);

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

    const isInitialLoading = useMemo(
        () => !apartmentsLoaded || !project || (viewMode === 'facade' && !facadeDataLoaded),
        [apartmentsLoaded, project, viewMode, facadeDataLoaded],
    );
    const showContent = apartmentsLoaded;

    const { isSubscriptionInactive, isOwner } = useSubscriptionStatus({ project, user });

    // ── Handlers ──

    const openApartmentDetails = async (apartment: Apartment) => {
        /*  if (isWidget) {
             scrollWidgetToTop();
             ui.openApartmentModal(apartment);
             return;
         } */

        ui.openApartmentDetails(apartment);

        try {
            const projectPath = project?.slug ? project.slug : `id/${project?.id || projectId}`;
            const base = `/${language}/project/${projectPath}/apartment/${apartment.apartment_number}`;

            const currentUrl = new URL(window.location.href);
            const newUrl = new URL(base, window.location.origin);
            currentUrl.searchParams.forEach((value, key) => {
                newUrl.searchParams.set(key, value);
            });

            window.history.pushState({ apartmentId: apartment.id }, '', newUrl.toString());
        } catch (e) {
            console.error('Error updating URL', e);
        }
    };

    const handleCloseApartmentDetails = useCallback(() => {
        window.history.back();
    }, []);

    const openFloorPreview = (floorNumber: number) => {
        setSelectedFloorForPlan(floorNumber);
        ui.openSidePanel({ kind: 'floor', floorNumber });
    };

    const openApartmentPreview = (apartment: Apartment) => {
        if (isMobile) {
            void openApartmentDetails(apartment);
            return;
        }
        ui.openSidePanel({ kind: 'apartment', apartment });
    };

    const openFloorPlanFromPanel = (floorNumber: number) => {
        setSelectedFloorForPlan(floorNumber);
        startTransition(() => {
            setViewMode('floor-plan');
            ui.closeSidePanel();
        });
    };

    // ── Side-effects ──

    useEffect(() => {
        const handlePopState = () => {
            closeApartmentDetailsAction();
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [closeApartmentDetailsAction]);

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
    }, [apartments, filters, selectedFloorForPlan, setSelectedFloorForPlan]);

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

    // ── Render ──

    const loaderBlock = (
        <div className="grid h-full w-full place-items-center absolute inset-0">
            <Spinner size="md" color={themeColor} />
        </div>
    );

    return (
        <div ref={containerRef} className="min-h-screen bg-white flex flex-col relative select-none">
            <LoaderView color={themeColor} loading={isInitialLoading} />
            <SubscriptionAlert
                isSubscriptionInactive={isSubscriptionInactive}
                isOwner={!!isOwner}
                language={language}
            />

            {project && (
                <>
                    <div className="flex grow min-h-0">
                        {/* Left column: header + content */}
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
                                isFiltersOpen={ui.isFiltersOpen}
                                setIsFiltersOpen={ui.setFiltersOpen}
                            />

                            {/* Main content area */}
                            <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
                                <ProjectErrorBoundary>
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
                                                        selectedCurrency={filters.selectedCurrency}
                                                        isPriceVisible={filters.isPriceVisible}
                                                        isAreaVisible={filters.isAreaVisible}
                                                        language={language}
                                                    />
                                                </Suspense>
                                            ) : viewMode === 'map' ? (
                                                <Suspense fallback={loaderBlock}>
                                                    <InteractiveProjectsMap
                                                        project={project}
                                                        onProjectSelect={() => setViewMode('list')}
                                                    />
                                                </Suspense>
                                            ) : viewMode === 'favorites' ? (
                                                <div className="container mx-auto py-8 grow">
                                                    <Suspense fallback={loaderBlock}>
                                                        <FavoritesTab
                                                            fieldVisible={visibleFields.map(field => field.field_name)}
                                                            handleViewApartment={openApartmentPreview}
                                                            projectId={project.id}
                                                            projectCurrency={project?.currency}
                                                            selectedCurrency={filters.selectedCurrency}
                                                        />
                                                    </Suspense>
                                                </div>
                                            ) : (
                                                <div className="relative flex-1 min-w-0 h-full">
                                                    {viewMode === 'facade' ? (
                                                        <FacadeSection
                                                            project={project as Project}
                                                            themeColor={themeColor}
                                                            imageUrl={activeFacadeImageUrl}
                                                            filtersRef={filtersRef}
                                                            buildingImageLoaded={buildingImageLoaded}
                                                            buildingImageNaturalSize={buildingImageNaturalSize}
                                                            visibleFields={visibleFields}
                                                            buildingFloors={buildingFloors}
                                                            facadeSettings={facadeSettings}
                                                            loading={floorsAllLoading || settingsLoading}
                                                            facades={facades.map(f => ({ id: f.id, name: f.name }))}
                                                            activeFacadeIndex={ui.activeFacadeIndex}
                                                            onFacadeChange={ui.setActiveFacadeIndex}
                                                            onFloorSelect={openFloorPreview}
                                                            onApartmentSelect={openApartmentPreview}
                                                            filters={filters}
                                                            setViewMode={setViewMode}
                                                            preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
                                                            isMobile={isMobile ?? false}
                                                        />
                                                    ) : (
                                                        <FloorPlanSection
                                                            project={project as Project}
                                                            filteredApartments={filters.filteredApartments}
                                                            allApartments={apartments}
                                                            selectedFloorForPlan={selectedFloorForPlan}
                                                            setSelectedFloorForPlan={setSelectedFloorForPlan}
                                                            onApartmentSelect={openApartmentPreview}
                                                            visibleFields={visibleFields}
                                                            getUniqueFloors={filters.getUniqueFloors}
                                                            themeColor={themeColor}
                                                            showOnlyAvailable={filters.showOnlyAvailable}
                                                            isMobile={isMobile ?? false}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : null}
                                </ProjectErrorBoundary>
                            </div>
                        </div>

                        {/* Right column: side panel */}
                        <SidePanelWrapper
                            open={ui.sidePanelOpen}
                            onOpenChange={ui.setSidePanelOpen}
                            state={ui.sidePanelState}
                            project={project as Project}
                            language={language}
                            themeColor={themeColor}
                            t={t as unknown as (key: string, options?: Record<string, unknown>) => unknown}
                            preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
                            filteredApartments={filters.filteredApartments}
                            onOpenApartmentDetails={(apt) => void openApartmentDetails(apt)}
                            onOpenFloorPlan={openFloorPlanFromPanel}
                        />
                    </div>


                    <ApartmentDetailsSheet
                        open={ui.isApartmentDetailsOpen}
                        onClose={handleCloseApartmentDetails}
                        apartment={ui.selectedApartment}
                        projectId={project.id}
                        loaderFallback={loaderBlock}
                    />
                </>
            )}
        </div>
    );
};

export default ProjectApartmentSelector;
