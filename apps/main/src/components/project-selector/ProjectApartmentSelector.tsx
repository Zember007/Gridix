import {
  lazy,
  startTransition,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Skeleton, useIsMobile, ViewTransition } from "@gridix/ui";
import { formatMoney } from "@gridix/utils/lib";
import type { Tables } from "@gridix/types/database";
import type { Project } from "@/entities/project/queries/useProjects";
import { Apartment } from "@/entities/apartment/model/types";
import { useLanguage } from "@gridix/utils/react";
import type { LayoutPhoto } from "./types";
import type {
  SubProjectListItem,
  MasterplanListItem,
} from "@/features/projectSelector/api/projectSelectorApi";
import { FilterFieldKey, useProjectFilters } from "./hooks/useProjectFilters";
import type { FieldVisibility } from "./types";
import LoaderView from "./views/LoaderView";
import { useProjectSelectorInitial } from "./hooks/useProjectSelectorInitial";
import { useProjectSelectorSubProject } from "./hooks/useProjectSelectorSubProject";
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
import {
  normalizeSubProjectKind,
  resolveSelectorEntityKind,
} from "./lib/subProjectDisplay";
import { resolveSubProjectSlugForApartmentUrl } from "./lib/resolveSubProjectSlugForApartmentUrl";
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
const MasterplanSection = lazy(() =>
  import("./sections/MasterplanSection").then((module) => ({
    default: module.MasterplanSection,
  })),
);
const SubProjectsListView = lazy(() =>
  import("./views/SubProjectsListView").then((module) => ({
    default: module.SubProjectsListView,
  })),
);

interface ProjectApartmentSelectorProps {
  projectId: string;
  isWidget?: boolean;
  showFullProjectInWidget?: boolean;
  subProjectSlug?: string;
}

type ModeContext = "project-multi-sub" | "default";

interface ProjectApartmentSelectorLoadedProps {
  projectId: string;
  isWidget: boolean;
  project: Project;
  subProject?: Tables<"sub_projects"> | null;
  subProjectId?: string | null;
  apartments: Apartment[];
  setApartments: React.Dispatch<React.SetStateAction<Apartment[]>>;
  apartmentsLoaded: boolean;
  preloadedLayoutPhotosByRooms: Record<string, LayoutPhoto[]>;
  firstApartmentPhotoById: Record<string, string | null>;
  rawFieldSettings: Array<Record<string, unknown>>;
  rawCustomFields: Array<Record<string, unknown>>;
  customDomain: string | null;
  modeContext: ModeContext;
  subProjects: SubProjectListItem[];
  masterplansList: MasterplanListItem[];
}

const loaderBlock = (themeColor: string) => (
  <div className="absolute inset-0 h-full w-full bg-white/80 p-4 backdrop-blur-sm md:p-6">
    <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-56 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20 max-sm:hidden" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="hidden space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-slate-200 p-3"
              >
                <Skeleton className="mb-3 aspect-[4/3] w-full" />
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span
        aria-hidden="true"
        className="h-1 rounded-full"
        style={{ backgroundColor: themeColor }}
      />
    </div>
  </div>
);

function ProjectApartmentSelectorLoaded({
  projectId,
  isWidget,
  project,
  subProject,
  subProjectId,
  apartments,
  setApartments,
  apartmentsLoaded,
  preloadedLayoutPhotosByRooms,
  firstApartmentPhotoById,
  rawFieldSettings,
  rawCustomFields,
  customDomain,
  modeContext,
  subProjects,
  masterplansList,
}: ProjectApartmentSelectorLoadedProps) {
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const headerTitle = useMemo(() => {
    if (!subProject) return undefined;
    const n = (subProject.name ?? "").trim();
    return n.length > 0 ? n : project.name;
  }, [subProject, project.name]);

  const handleBackToGenplan = useCallback(() => {
    if (!subProject) return;
    const preserved = { search: location.search, hash: location.hash };
    if (isWidget) {
      navigate({ pathname: "/", ...preserved });
      return;
    }
    const projectPath = project.slug ? project.slug : `id/${project.id}`;
    if (customDomain) {
      navigate({ pathname: "/", ...preserved });
      return;
    }
    const isWidgetPath = location.pathname.includes("/widget/");
    const pathname = isWidgetPath
      ? `/${language}/widget/${projectPath}`
      : `/${language}/project/${projectPath}`;
    navigate({ pathname, ...preserved });
  }, [
    subProject,
    isWidget,
    customDomain,
    project.slug,
    project.id,
    language,
    location.pathname,
    location.search,
    location.hash,
    navigate,
  ]);

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

  // Facade data (TanStack Query) — not used on project hub when genplan tab shows MasterplanSection
  const shouldLoadFacadeData =
    viewMode === "facade" &&
    !!project?.id &&
    modeContext !== "project-multi-sub";

  const {
    facades,
    floorsByFacadeId,
    floorsLoading: floorsAllLoading,
    facadeSettings,
    settingsLoading,
  } = useFacadeData({
    projectId: project?.id,
    subProjectId: subProjectId ?? undefined,
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

  const subProjectKinds = useMemo(
    () =>
      Object.fromEntries(
        subProjects.map((sp) => [sp.id, normalizeSubProjectKind(sp.type)]),
      ) as Record<string, "building" | "object">,
    [subProjects],
  );

  const hasObjects = useMemo(
    () =>
      subProjects.some((sp) => normalizeSubProjectKind(sp.type) === "object"),
    [subProjects],
  );

  // ── Filters ──

  const filters = useProjectFilters({
    apartments,
    project: project ?? undefined,
    visibleFilterFields,
    subProjectKinds,
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

  const effectiveProjectType = useMemo(
    (): "building" | "object" =>
      resolveSelectorEntityKind(subProject, subProjects),
    [subProject, subProjects],
  );

  const mapDisplayProject = useMemo((): Tables<"projects"> | null => {
    if (!project) return null;
    const useSubCoords =
      subProject != null &&
      subProject.latitude != null &&
      subProject.longitude != null;
    const lat = useSubCoords ? subProject.latitude : (project.latitude ?? null);
    const lon = useSubCoords
      ? subProject.longitude
      : (project.longitude ?? null);
    if (lat == null || lon == null) return null;
    return {
      ...project,
      latitude: lat,
      longitude: lon,
      name: useSubCoords ? subProject.name : project.name,
      address: useSubCoords
        ? (subProject.address ?? null)
        : (project.address ?? null),
      building_image_url: useSubCoords
        ? (subProject.building_image_url ?? project.building_image_url ?? null)
        : (project.building_image_url ?? null),
    };
  }, [project, subProject]);

  const mapVisible = mapDisplayProject != null;

  const { convertPrice, selectedCurrency } = filters;
  const formatListingPrice = useCallback(
    (price: number) =>
      formatMoney(
        convertPrice(price, project?.currency, selectedCurrency),
        selectedCurrency,
      ),
    [convertPrice, selectedCurrency, project?.currency],
  );

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
        const aptSeg = encodeURIComponent(apartment.apartment_number);
        const subSlugRaw = resolveSubProjectSlugForApartmentUrl(
          subProject,
          subProjects,
        );

        let path: string;
        if (subSlugRaw) {
          const subSeg = encodeURIComponent(subSlugRaw);
          if (customDomain) {
            path = `/p/${subSeg}/apartment/${aptSeg}`;
          } else {
            const projectPath = project?.slug
              ? project.slug
              : `id/${project?.id || projectId}`;
            path = `/${language}/project/${projectPath}/p/${subSeg}/apartment/${aptSeg}`;
          }
        } else {
          if (customDomain) {
            path = `/apartment/${aptSeg}`;
          } else {
            const projectPath = project?.slug
              ? project.slug
              : `id/${project?.id || projectId}`;
            path = `/${language}/project/${projectPath}/apartment/${aptSeg}`;
          }
        }

        const baseOrigin = customDomain
          ? `https://${customDomain}`
          : window.location.origin;

        const currentUrl = new URL(window.location.href);
        const newUrl = new URL(path, baseOrigin);
        currentUrl.searchParams.forEach((value, key) => {
          newUrl.searchParams.set(key, value);
        });

        window.history.pushState(
          { apartmentNumber: apartment.apartment_number },
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
    subProjectId: subProjectId ?? undefined,
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
      className={`relative flex ${isWidget ? "h-full min-h-0" : "min-h-screen"} select-none flex-col bg-white`}
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
            mapVisible={mapVisible}
            projectType={effectiveProjectType}
            themeColor={themeColor}
            filters={filters}
            isFiltersOpen={ui.isFiltersOpen}
            setIsFiltersOpen={ui.setFiltersOpen}
            modeContext={modeContext}
            headerTitle={headerTitle}
            onBack={subProject ? handleBackToGenplan : undefined}
            backAriaLabel={subProject ? t("project.backToGenplan") : undefined}
          />

          {/* Main content area */}
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            <ProjectErrorBoundary>
              {showContent ? (
                <ViewTransition
                  viewKey={`${viewMode}-${modeContext}`}
                  className="h-full min-w-0"
                >
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
                        firstApartmentPhotoById={firstApartmentPhotoById}
                        getVisibleFields={getVisibleFields}
                        getCustomFieldValue={getCustomFieldValue}
                        formatFieldValue={formatFieldValue}
                        getFieldLabel={getFieldLabel}
                        groupApartmentsByFloor={groupApartmentsByFloor}
                        convertPrice={filters.convertPrice}
                        formatPrice={formatPrice}
                        project={project}
                        projectType={effectiveProjectType}
                        selectedCurrency={filters.selectedCurrency}
                        isMobile={isMobile ?? false}
                        themeColor={themeColor}
                        fieldVisibility={fieldVisibility}
                        hasObjects={hasObjects}
                      />
                    </Suspense>
                  ) : viewMode === "chess" ? (
                    modeContext === "project-multi-sub" ? (
                      <Suspense fallback={loaderFallback}>
                        <SubProjectsListView
                          subProjects={subProjects}
                          themeColor={themeColor}
                          formatListingPrice={formatListingPrice}
                        />
                      </Suspense>
                    ) : (
                      <Suspense fallback={loaderFallback}>
                        <ChessView
                          project={project as Project}
                          subProject={subProject}
                          apartments={filters.filteredApartments}
                          onApartmentSelect={openApartmentPreview}
                          onOpenFloorPlan={openFloorPlanFromPanel}
                          themeColor={themeColor}
                          selectedCurrency={filters.selectedCurrency}
                          fieldVisibility={fieldVisibility}
                          language={language}
                        />
                      </Suspense>
                    )
                  ) : viewMode === "map" ? (
                    <Suspense fallback={loaderFallback}>
                      {mapDisplayProject ? (
                        <div className="h-full min-h-0 px-4 md:px-0">
                          <InteractiveProjectsMap
                            project={mapDisplayProject}
                            onProjectSelect={() => setViewMode("list")}
                          />
                        </div>
                      ) : (
                        <div className="flex h-[80vh] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                          {t("project.mapNoCoordinates")}
                        </div>
                      )}
                    </Suspense>
                  ) : viewMode === "favorites" ? (
                    <div className="container mx-auto grow px-4 py-8 md:px-6">
                      <Suspense fallback={loaderFallback}>
                        <FavoritesTab
                          fieldVisible={visibleFields.map(
                            (field) => field.field_name,
                          )}
                          handleViewApartment={openApartmentPreview}
                          projectId={project.id}
                          projectCurrency={project?.currency}
                          selectedCurrency={filters.selectedCurrency}
                          firstApartmentPhotoById={firstApartmentPhotoById}
                        />
                      </Suspense>
                    </div>
                  ) : (
                    <div className="relative h-full min-w-0 flex-1">
                      {viewMode === "facade" ? (
                        modeContext === "project-multi-sub" ? (
                          <Suspense fallback={loaderFallback}>
                            <MasterplanSection
                              project={project as Project}
                              projectId={project.id}
                              themeColor={themeColor}
                              masterplansList={masterplansList}
                              subProjects={subProjects}
                            />
                          </Suspense>
                        ) : (
                          <Suspense fallback={loaderFallback}>
                            <FacadeSection
                              project={project as Project}
                              projectType={effectiveProjectType}
                              themeColor={themeColor}
                              imageUrl={activeFacadeImageUrl}
                              filtersRef={filtersRef}
                              buildingImageLoaded={buildingImageLoaded}
                              buildingImageNaturalSize={
                                buildingImageNaturalSize
                              }
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
                        )
                      ) : (
                        <Suspense fallback={loaderFallback}>
                          <FloorPlanSection
                            project={project as Project}
                            subProjectId={subProjectId}
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
                </ViewTransition>
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
          subProject={subProject}
          subProjects={subProjects}
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

const ProjectApartmentSelectorWithSubProject = ({
  projectId,
  subProjectSlug,
  isWidget,
}: {
  projectId: string;
  subProjectSlug: string;
  isWidget: boolean;
}) => {
  const {
    project,
    subProject,
    subProjectId,
    apartments,
    setApartments,
    apartmentsLoaded,
    preloadedLayoutPhotosByRooms,
    firstApartmentPhotoById,
    fieldSettings: rawFieldSettings,
    customFields: rawCustomFields,
    customDomain,
    subProjectNotFound,
  } = useProjectSelectorSubProject(projectId, subProjectSlug);

  const themeColor = project?.theme_color ?? "#000000";

  if (subProjectNotFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Building not found</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white">
      <LoaderView color={themeColor} loading={!project || !apartmentsLoaded} />
      {project ? (
        <ProjectApartmentSelectorLoaded
          projectId={projectId}
          isWidget={isWidget}
          project={project}
          subProject={subProject}
          subProjectId={subProjectId}
          apartments={apartments}
          setApartments={setApartments}
          apartmentsLoaded={apartmentsLoaded}
          preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
          firstApartmentPhotoById={firstApartmentPhotoById}
          rawFieldSettings={rawFieldSettings}
          rawCustomFields={rawCustomFields}
          customDomain={customDomain}
          modeContext="default"
          subProjects={[]}
          masterplansList={[]}
        />
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="md" color={themeColor} />
        </div>
      )}
    </div>
  );
};

const ProjectApartmentSelectorDefault = ({
  projectId,
  isWidget,
}: {
  projectId: string;
  isWidget: boolean;
}) => {
  const {
    project,
    apartments,
    setApartments,
    apartmentsLoaded,
    preloadedLayoutPhotosByRooms,
    firstApartmentPhotoById,
    fieldSettings: rawFieldSettings,
    customFields: rawCustomFields,
    customDomain,
    subProjects,
    masterplansList,
  } = useProjectSelectorInitial(projectId);

  const themeColor = project?.theme_color ?? "#000000";

  // Genplan hub UX when selector returns at least one masterplan (published/active in API).
  const modeContext: ModeContext =
    masterplansList.length > 0 ? "project-multi-sub" : "default";

  return (
    <div className="relative min-h-screen bg-white">
      <LoaderView color={themeColor} loading={!project || !apartmentsLoaded} />
      {project ? (
        <ProjectApartmentSelectorLoaded
          projectId={projectId}
          isWidget={isWidget}
          project={project}
          subProject={null}
          apartments={apartments}
          setApartments={setApartments}
          apartmentsLoaded={apartmentsLoaded}
          preloadedLayoutPhotosByRooms={preloadedLayoutPhotosByRooms}
          firstApartmentPhotoById={firstApartmentPhotoById}
          rawFieldSettings={rawFieldSettings}
          rawCustomFields={rawCustomFields}
          customDomain={customDomain}
          modeContext={modeContext}
          subProjects={subProjects}
          masterplansList={masterplansList}
        />
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="md" color={themeColor} />
        </div>
      )}
    </div>
  );
};

const ProjectApartmentSelector = ({
  projectId,
  isWidget: isWidgetProp = false,
  subProjectSlug,
}: ProjectApartmentSelectorProps) => {
  const [searchParams] = useSearchParams();
  const isWidgetFromUrl = searchParams.get("isWidget") === "true";
  const isWidget = isWidgetProp || isWidgetFromUrl;

  if (subProjectSlug) {
    return (
      <ProjectApartmentSelectorWithSubProject
        projectId={projectId}
        subProjectSlug={subProjectSlug}
        isWidget={isWidget}
      />
    );
  }

  return (
    <ProjectApartmentSelectorDefault
      projectId={projectId}
      isWidget={isWidget}
    />
  );
};

export default ProjectApartmentSelector;
