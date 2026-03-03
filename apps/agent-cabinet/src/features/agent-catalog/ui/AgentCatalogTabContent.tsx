import { InteractiveProjectsMap, SharedProjectDrawer } from "@gridix/ui";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";
import { Project, toSharedProject } from "@/entities/project";
import { CatalogGrid } from "./CatalogGrid";
import { ProjectDrawerUnitsTab } from "./ProjectDrawerUnitsTab";
import { useAgentCatalogTabModel } from "../model/useAgentCatalogTabModel";

export function AgentCatalogTabContent() {
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
  } = useAgentCatalogTabModel();

  const subtitle = selected
    ? t("common.catalog.subtitleWithWorkspace", {
        workspace: selected.label,
      })
    : t("common.catalog.subtitle");
  const isGridView = viewMode === "grid";
  const showFiltersBar = showFilters && isGridView;
  const activeFiltersCount = searchQuery.trim() ? 1 : 0;
  const contentContainerClassName = `flex-1 overflow-y-auto bg-slate-50 ${isGridView ? "p-4 md:p-6" : "p-0"} custom-scrollbar`;

  const handleOpenProjectFromMap = (project: Project) => {
    const shareUrl = shareUrlForProject(project);
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const renderContent = () => {
    if (!activeWorkspaceId) {
      return <EmptyState message={t("common.workspace.pickInSidebar")} />;
    }

    if (projectsQuery.isLoading) {
      return <LoadingState message={t("common.common.loading")} />;
    }

    if (filtered.length === 0) {
      return <EmptyState message={t("common.catalog.noProjects")} />;
    }

    if (isGridView) {
      return (
        <CatalogGrid
          projects={filtered}
          t={t}
          shareUrlForProject={shareUrlForProject}
          onOpenProject={handleOpenProject}
        />
      );
    }

    return (
      <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <InteractiveProjectsMap
          projects={filtered as any[]}
          onOpenProject={(project) =>
            handleOpenProjectFromMap(project as Project)
          }
        />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      {selectedProject && (
        <SharedProjectDrawer
          project={drawerProject ?? toSharedProject(selectedProject)}
          mode="agent"
          onClose={handleCloseDrawer}
          onShare={handleShareProject}
          onOpenPublicPage={handleOpenPublicPage}
          renderUnitsTab={(project) => (
            <ProjectDrawerUnitsTab
              project={project}
              activeWorkspaceId={activeWorkspaceId}
              baseUrl={baseUrl}
              language={language}
              t={t}
            />
          )}
        />
      )}

      <ModuleHeader
        title={t("common.catalog.title")}
        subtitle={subtitle}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("common.catalog.searchPlaceholder")}
        onFilterClick={() => setShowFilters(!showFilters)}
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

      <div className={contentContainerClassName}>
        <div className="h-full">{renderContent()}</div>
      </div>
    </div>
  );
}
