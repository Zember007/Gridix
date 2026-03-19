import {
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useSearchParams } from "react-router-dom";
import { useIsMobile } from "@gridix/ui";
import type { Project } from "@/entities/project/queries/useProjects";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@gridix/utils/react";
import type { LayoutPhoto } from "./types";
import { FilterFieldKey, useProjectFilters } from "./hooks/useProjectFilters";
import type { FieldVisibility } from "./types";
import LoaderView from "./views/LoaderView";
import { useProjectSelectorInitial } from "./hooks/useProjectSelectorInitial";
import { useBuildingImage } from "./hooks/useBuildingImage";
import { useFloorPolygons } from "./hooks/useFloorPolygons";
import { useWidgetScroll } from "./hooks/useWidgetScroll";
import { useFieldHelpers } from "./hooks/useFieldHelpers";
import { getApartmentFieldVisibility } from "@/shared/lib/fieldVisibility";
import { persistAgentAttribution } from "@/shared/lib/agent-attribution";
import { useSubscriptionStatus } from "./hooks/useSubscriptionStatus";
import { useFacadeData } from "./hooks/useFacadeData";
import { useUrlState } from "./hooks/useUrlState";
import { useSelectorUIState } from "./hooks/useSelectorUIState";
import { SubscriptionAlert } from "./SubscriptionAlert";
import { ProjectHeader } from "./ProjectHeader";
import Spinner from "@/shared/ui/Spinner.tsx";
import { useFields } from "@/hooks/useFields";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/contexts/AuthContext";
// Section components
import { SidePanelWrapper } from "./sections/SidePanelWrapper";
import { ApartmentDetailsSheet } from "./sections/ApartmentDetailsSheet";
import { ProjectErrorBoundary } from "./sections/ProjectErrorBoundary";

// Lazy load components at module level (outside component)
const InteractiveProjectsMap = lazy(
  () => import("@/components/visualization/InteractiveProjectsMap"),
);
const FavoritesTab = lazy(() => import("../FavoritesTab"));
const ListView = lazy(() =>
  import("./views/ListView").then((module) => ({ default: module.ListView })),
);
const ChessView = lazy(() =>
  import("./views/ChessView").then((module) => ({
    default: module.ChessView,
  })),
);
const FacadeSection = lazy(() =>
  import("./sections/FacadeSection").then((module) => ({
    default: module.FacadeSection,
  })),
);
const FloorPlanSection = lazy(() =>
  import("./sections/FloorPlanSection").then((module) => ({
    default: module.FloorPlanSection,
  })),
);

interface ProjectApartmentSelectorProps {
  projectId: string;
  isWidget?: boolean;
  showFullProjectInWidget?: boolean;
}

interface ProjectApartmentSelectorLoadedProps {
  projectId: string;
  isWidget: boolean;
  project: Project;
  apartments: Apartment[];
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  apartmentsLoaded: boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  rawFieldSettings: Array<Record<string, unknown>>;
  rawCustomFields: Array<Record<string, unknown>>;
  customDomain: string | null;
}

const loaderBlock = (themeColor: string) => (
  <div className="absolute inset-0 grid h-full w-full place-items-center">
    <Spinner size="md" color={themeColor} />
  </div>
);

function ProjectApartmentSelectorLoaded({
  projectId,
  isWidget,
  project,
  apartments,
  setApartments,
  apartmentsLoaded,
  preloadedLayoutPhotosByRooms,
  rawFieldSettings,
  rawCustomFields,
  customDomain,
}: ProjectApartmentSelectorLoadedProps) {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();

  const { fields: fieldSettings } = useFields(project?.id || null, {
    fieldSettings: rawFieldSettings,
    customFields: rawCustomFields,
  });
  const { favoritesCount } = useFavorites(project?.id || undefined);
  const { user } = useAuth();

  // State (viewMode & floor are synced to URL search params)
  const {
    viewMode,
    setViewMode,
    selectedFloorForPlan,
    setSelectedFloorForPlan,
  } = useUrlState();

  // UI state (panels, modals, facades) via reducer
  const ui = useSelectorUIState();

  const filtersRef = useRef<HTMLDivElement>(null);

  const visibleFilterFields = useMemo<Record<FilterFieldKey, boolean>>(
    () => getApartmentFieldVisibility(fieldSettings),
    [fieldSettings],
  );

  const fieldVisibility = useMemo<FieldVisibility>(
    () => ({
      rooms: visibleFilterFields.rooms,
      floor: visibleFilterFields.floor,
      price: visibleFilterFields.price,
      area: visibleFilterFields.area,
      number: visibleFilterFields.number,
      status: visibleFilterFields.status,
      tooltip: true,
    }),
    [visibleFilterFields],
  );

  // Facade data (TanStack Query)
  const shouldLoadFacadeData = viewMode === "facade" && !!project?.id;

  const {
    facades,
    floorsByFacadeId,
    floorsLoading: floorsAllLoading,
    facadeSettings,
    settingsLoading,
  } = useFacadeData({
    projectId: project?.id,
    enabled: shouldLoadFacadeData,
  });

  // Destructure stable callbacks for use in effects
  const {
    clampFacadeIndex,
    closeApartmentDetails: closeApartmentDetailsAction,
  } = ui;
  useEffect(() => {
    if (facades.length > 0) {
      clampFacadeIndex(facades.length);
    }
  }, [facades.length, clampFacadeIndex]);

  const activeFacade = useMemo(
    () => facades[ui.activeFacadeIndex] ?? facades[0] ?? null,
    [facades, ui.activeFacadeIndex],
  );
  const activeFacadeImageUrl =
    activeFacade?.image_url ?? project?.building_image_url ?? null;

  const { buildingImageLoaded, buildingImageNaturalSize } =
    useBuildingImage(activeFacadeImageUrl);

  const buildingFloors = useMemo(() => {
    if (!activeFacade?.id) return [];
    return floorsByFacadeId[activeFacade.id] ?? [];
  }, [activeFacade?.id, floorsByFacadeId]);

  const { containerRef, scrollWidgetToTop } = useWidgetScroll(isWidget, [
    viewMode,
  ]);
  const widgetPortalContainer = useMemo<HTMLElement | null>(() => {
    if (!isWidget || typeof document === "undefined") return null;

    const widgetHost = document.getElementById("gridix-widget-root");
    return (
      widgetHost?.shadowRoot?.getElementById("gridix-portal-container") ?? null
    );
  }, [isWidget]);

  // ── Filters ──

  const filters = useProjectFilters({
    apartments,
    project: project ?? undefined,
    visibleFilterFields,
  });

  const { getFieldLabel, getCustomFieldValue, formatFieldValue, formatPrice } =
    useFieldHelpers({
      language,
      t,
      convertPrice: filters.convertPrice,
      projectCurrency: project?.currency,
      selectedCurrency: filters.selectedCurrency,
      selectedType: filters.selectedType,
    });

  // ── Computed values ──

  const themeColor = project?.theme_color ?? "#000000";

  const visibleFields = useMemo(
    () =>
      fieldSettings
        .filter((field) => field.is_visible)
        .sort((a, b) => a.sort_order - b.sort_order),
    [fieldSettings],
  );

  const getVisibleFields = useCallback(() => visibleFields, [visibleFields]);

  const groupApartmentsByFloor = useMemo(() => {
    const grouped = filters.filteredApartments.reduce(
      (acc, apartment) => {
        const floor = apartment.floor_number;
        if (!acc[floor]) {
          acc[floor] = [];
        }
        acc[floor].push(apartment);
        return acc;
      },
      {} as Record<number, Apartment[]>,
    );

    const sortedFloors = Object.keys(grouped)
      .map(Number)
      .sort((a, b) => b - a);

    return sortedFloors.map((floor) => ({
      floor,
      apartments: (grouped[floor] || []).sort((a, b) => {
        if (a.apartment_number && b.apartment_number) {
          return a.apartment_number.localeCompare(b.apartment_number);
        }
        return a.id.localeCompare(b.id);
      }),
    }));
  }, [filters.filteredApartments]);

  const showContent = apartmentsLoaded;

  const { isSubscriptionInactive, isOwner } = useSubscriptionStatus({
    project,
    user,
  });

  // ── Handlers ──

  const openApartmentDetails = async (apartment: Apartment) => {
    if (isWidget) {
      scrollWidgetToTop();
    }

    ui.openApartmentDetails(apartment);

    if (!isWidget) {
      try {
        const projectPath = project?.slug
          ? project.slug
          : `id/${project?.id || projectId}`;
        const path = `/${language}/project/${projectPath}/apartment/${apartment.apartment_number}`;

        const baseOrigin = customDomain
          ? `https://${customDomain}`
          : window.location.origin;

        const currentUrl = new URL(window.location.href);
        const newUrl = new URL(path, baseOrigin);
        currentUrl.searchParams.forEach((value, key) => {
          newUrl.searchParams.set(key, value);
        });

        window.history.pushState(
          { apartmentId: apartment.id },
          "",
          newUrl.toString(),
        );
      } catch (e) {
        console.error("Error updating URL", e);
      }
    }
  };

  const handleCloseApartmentDetails = useCallback(() => {
    if (isWidget) {
      closeApartmentDetailsAction();
    } else {
      window.history.back();
    }
  }, [isWidget, closeApartmentDetailsAction]);

  const openFloorPreview = (floorNumber: number) => {
    setSelectedFloorForPlan(floorNumber);
    ui.openSidePanel({ kind: "floor", floorNumber });
  };

  const openApartmentPreview = (apartment: Apartment) => {
    if (isMobile) {
      void openApartmentDetails(apartment);
      return;
    }
    ui.openSidePanel({ kind: "apartment", apartment });
  };

  const openFloorPlanFromPanel = (floorNumber: number) => {
    setSelectedFloorForPlan(floorNumber);
    startTransition(() => {
      setViewMode("floor-plan");
      ui.closeSidePanel();
    });
  };

  // ── Side-effects ──

  useEffect(() => {
    const handlePopState = () => {
      closeApartmentDetailsAction();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
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
    const urlAgentId = searchParams.get("agent_id")?.trim();

    if (urlAgentId) {
      persistAgentAttribution(urlAgentId, projectId);
    }
  }, [projectId, searchParams]);

  const loaderFallback = loaderBlock(themeColor);

  if (!project) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex ${isWidget ? "h-full min-h-0 overflow-hidden" : "min-h-screen"} select-none flex-col bg-white`}
    >
      <SubscriptionAlert
        isSubscriptionInactive={isSubscriptionInactive}
        isOwner={!!isOwner}
        language={language}
      />

      <div className="flex min-h-0 grow">
        {/* Left column: header + content */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ProjectHeader
            filtersRef={filtersRef}
            project={project as Project}
            isWidget={isWidget}
            isMobile={isMobile ?? false}
            viewMode={viewMode}
            setViewMode={setViewMode}
            favoritesCount={favoritesCount}
            mapVisible={!!project?.latitude && !!project?.longitude}
            projectType={project?.project_type as "building" | "object" | null}
            themeColor={themeColor}
            filters={filters}
            isFiltersOpen={ui.isFiltersOpen}
            setIsFiltersOpen={ui.setFiltersOpen}
          />

          {/* Main content area */}
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            <ProjectErrorBoundary>
              {showContent ? (
                <>
                  {viewMode === "list" ? (
                    <Suspense fallback={loaderFallback}>
                      <ListView
                        filteredApartments={filters.filteredApartments}
                        listViewMode="list"
                        setListViewMode={(mode) => {
                          if (mode === "grid") setViewMode("chess");
                          else setViewMode("list");
                        }}
                        hideViewToggle={true}
                        selectedType={filters.selectedType}
                        setSelectedType={filters.setSelectedType}
                        openApartmentDetails={openApartmentPreview}
                        preloadedLayoutPhotosByRooms={
                          preloadedLayoutPhotosByRooms
                        }
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
                        fieldVisibility={fieldVisibility}
                      />
                    </Suspense>
                  ) : viewMode === "chess" ? (
                    <Suspense fallback={loaderFallback}>
                      <ChessView
                        project={project as Project}
                        apartments={filters.filteredApartments}
                        onApartmentSelect={openApartmentPreview}
                        onOpenFloorPlan={openFloorPlanFromPanel}
                        themeColor={themeColor}
                        selectedCurrency={filters.selectedCurrency}
                        fieldVisibility={fieldVisibility}
                        language={language}
                      />
                    </Suspense>
                  ) : viewMode === "map" ? (
                    <Suspense fallback={loaderFallback}>
                      <InteractiveProjectsMap
                        project={project}
                        onProjectSelect={() => setViewMode("list")}
                      />
                    </Suspense>
                  ) : viewMode === "favorites" ? (
                    <div className="container mx-auto grow py-8">
                      <Suspense fallback={loaderFallback}>
                        <FavoritesTab
                          fieldVisible={visibleFields.map(
                            (field) => field.field_name,
                          )}
                          handleViewApartment={openApartmentPreview}
                          projectId={project.id}
                          projectCurrency={project?.currency}
                          selectedCurrency={filters.selectedCurrency}
                        />
                      </Suspense>
                    </div>
                  ) : (
                    <div className="relative h-full min-w-0 flex-1">
                      {viewMode === "facade" ? (
                        <Suspense fallback={loaderFallback}>
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
                            facades={facades.map((f) => ({
                              id: f.id,
                              name: f.name,
                            }))}
                            activeFacadeIndex={ui.activeFacadeIndex}
                            onFacadeChange={ui.setActiveFacadeIndex}
                            onFloorSelect={openFloorPreview}
                            onApartmentSelect={openApartmentPreview}
                            filters={filters}
                            setViewMode={setViewMode}
                            preloadedLayoutPhotosByRooms={
                              preloadedLayoutPhotosByRooms
                            }
                            isMobile={isMobile ?? false}
                          />
                        </Suspense>
                      ) : (
                        <Suspense fallback={loaderFallback}>
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
                            selectedCurrency={filters.selectedCurrency}
                          />
                        </Suspense>
                      )}
                    </div>
                  )}
                </>
              ) : (
                loaderFallback
              )}
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
          t={
            t as unknown as (
              key: string,
              options?: Record<string, unknown>,
            ) => unknown
          }
          preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
          filteredApartments={filters.filteredApartments}
          onOpenApartmentDetails={(apt) => void openApartmentDetails(apt)}
          onOpenFloorPlan={openFloorPlanFromPanel}
          selectedCurrency={filters.selectedCurrency}
          fieldVisibility={fieldVisibility}
        />
      </div>

      <ApartmentDetailsSheet
        open={ui.isApartmentDetailsOpen}
        onClose={handleCloseApartmentDetails}
        apartment={ui.selectedApartment}
        projectId={project.id}
        loaderFallback={loaderFallback}
        portalContainer={widgetPortalContainer}
        isWidget={isWidget}
      />
    </div>
  );
}

const ProjectApartmentSelector = ({
  projectId,
  isWidget: isWidgetProp = false,
}: ProjectApartmentSelectorProps) => {
  const [searchParams] = useSearchParams();
  const isWidgetFromUrl = searchParams.get("isWidget") === "true";
  const isWidget = isWidgetProp || isWidgetFromUrl;

  const {
    project,
    apartments,
    setApartments,
    apartmentsLoaded,
    preloadedLayoutPhotosByRooms,
    fieldSettings: rawFieldSettings,
    customFields: rawCustomFields,
    customDomain,
  } = useProjectSelectorInitial(projectId);

  const themeColor = project?.theme_color ?? "#000000";

  return (
    <div className="relative min-h-screen bg-white">
      <LoaderView color={themeColor} loading={!project || !apartmentsLoaded} />
      {project ? (
        <ProjectApartmentSelectorLoaded
          projectId={projectId}
          isWidget={isWidget}
          project={project}
          apartments={apartments}
          setApartments={setApartments}
          apartmentsLoaded={apartmentsLoaded}
          preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
          rawFieldSettings={rawFieldSettings}
          rawCustomFields={rawCustomFields}
          customDomain={customDomain}
        />
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="md" color={themeColor} />
        </div>
      )}
    </div>
  );
};

export default ProjectApartmentSelector;
