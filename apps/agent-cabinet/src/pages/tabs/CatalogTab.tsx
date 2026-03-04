import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { AgentCatalogExplorer } from "@/widgets/agent-catalog-explorer";
import { useCatalogTabPageModel } from "./model/useCatalogTabPageModel";

export function CatalogTab() {
  const {
    activeWorkspaceId,
    baseUrl,
    drawerProject,
    filtered,
    handleCloseDrawer,
    handleOpenProject,
    handleOpenPublicPage,
    handleShareProject,
    language,
    projectsQuery,
    searchQuery,
    selected,
    selectedProject,
    setSearchQuery,
    setShowFilters,
    setViewMode,
    shareUrlForProject,
    showFilters,
    t,
    viewMode,
  } = useCatalogTabPageModel();

  const subtitle = selected
    ? t("common.catalog.subtitleWithWorkspace", {
        workspace: selected.label,
      })
    : t("common.catalog.subtitle");
  const isGridView = viewMode === "grid";
  const showFiltersBar = showFilters && isGridView;
  const activeFiltersCount = searchQuery.trim() ? 1 : 0;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      <ModuleHeader
        title={t("common.catalog.title")}
        subtitle={subtitle}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("common.catalog.searchPlaceholder")}
        onFilterClick={() => setShowFilters((prev) => !prev)}
        activeFiltersCount={activeFiltersCount}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode as "grid" | "map")}
        availableViews={["grid", "map"]}
      />

      {showFiltersBar && (
        <div className="border-b border-slate-200 bg-white px-4 py-3 animate-in slide-in-from-top-2 md:px-6">
          <div className="text-xs text-slate-500">
            {t("common.catalog.filtersPlaceholder")}
          </div>
        </div>
      )}

      <AgentCatalogExplorer
        activeWorkspaceId={activeWorkspaceId}
        baseUrl={baseUrl}
        drawerProject={drawerProject}
        filtered={filtered}
        handleCloseDrawer={handleCloseDrawer}
        handleOpenProject={handleOpenProject}
        handleOpenPublicPage={handleOpenPublicPage}
        handleShareProject={handleShareProject}
        language={language}
        projectsLoading={projectsQuery.isLoading}
        selectedProject={selectedProject}
        shareUrlForProject={shareUrlForProject}
        t={t}
        viewMode={viewMode}
      />
    </div>
  );
}
