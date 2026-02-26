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

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      {selectedProject ? (
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
      ) : null}

      <ModuleHeader
        title={t("common.catalog.title")}
        subtitle={
          selected
            ? t("common.catalog.subtitleWithWorkspace", {
                workspace: selected.label,
              })
            : t("common.catalog.subtitle")
        }
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("common.catalog.searchPlaceholder")}
        onFilterClick={() => setShowFilters(!showFilters)}
        activeFiltersCount={searchQuery.trim() ? 1 : 0}
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode as "grid" | "map")}
        availableViews={["grid", "map"]}
      />

      {showFilters && viewMode !== "map" ? (
        <div className="border-b border-slate-200 bg-white px-4 py-3 animate-in slide-in-from-top-2 md:px-6">
          <div className="text-xs text-slate-500">
            {t("common.catalog.filtersPlaceholder")}
          </div>
        </div>
      ) : null}

      <div
        className={`flex-1 overflow-y-auto bg-slate-50 ${viewMode === "grid" ? "p-4 md:p-6" : "p-0"} custom-scrollbar`}
      >
        <div className="h-full">
          {!activeWorkspaceId ? (
            <EmptyState message={t("common.workspace.pickInSidebar")} />
          ) : projectsQuery.isLoading ? (
            <LoadingState message={t("common.common.loading")} />
          ) : filtered.length === 0 ? (
            <EmptyState message={t("common.catalog.noProjects")} />
          ) : viewMode === "grid" ? (
            <CatalogGrid
              projects={filtered}
              t={t}
              shareUrlForProject={shareUrlForProject}
              onOpenProject={handleOpenProject}
            />
          ) : (
            <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <InteractiveProjectsMap
                projects={filtered as any[]}
                onOpenProject={(project) => {
                  const shareUrl = shareUrlForProject(project as Project);
                  if (!shareUrl) return;
                  window.open(shareUrl, "_blank", "noopener,noreferrer");
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
