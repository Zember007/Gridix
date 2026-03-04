import {
  InteractiveProjectsMap,
  SharedProjectDrawer,
  type SharedProject,
} from "@gridix/ui";
import { type Project, toSharedProject } from "@/entities/project";
import { CatalogGrid } from "@/features/agent-catalog/ui/CatalogGrid";
import { ProjectDrawerUnitsTab } from "@/features/agent-catalog/ui/ProjectDrawerUnitsTab";
import { EmptyState } from "@/shared/ui/EmptyState";
import { LoadingState } from "@/shared/ui/LoadingState";

interface AgentCatalogExplorerProps {
  activeWorkspaceId: string | null;
  baseUrl: string;
  drawerProject: SharedProject | null;
  filtered: Project[];
  handleCloseDrawer: () => void;
  handleOpenProject: (project: Project) => void;
  handleOpenPublicPage: (project: SharedProject) => void;
  handleShareProject: (project: SharedProject) => void;
  language: string;
  projectsLoading: boolean;
  selectedProject: Project | null;
  shareUrlForProject: (project: Project) => string | null;
  t: (key: string) => string;
  viewMode: "grid" | "map";
}

export function AgentCatalogExplorer({
  activeWorkspaceId,
  baseUrl,
  drawerProject,
  filtered,
  handleCloseDrawer,
  handleOpenProject,
  handleOpenPublicPage,
  handleShareProject,
  language,
  projectsLoading,
  selectedProject,
  shareUrlForProject,
  t,
  viewMode,
}: AgentCatalogExplorerProps) {
  const isGridView = viewMode === "grid";
  const contentContainerClassName = `flex-1 overflow-y-auto bg-slate-50 ${
    isGridView ? "p-4 md:p-6" : "p-0"
  } custom-scrollbar`;

  const handleOpenProjectFromMap = (project: Project) => {
    const shareUrl = shareUrlForProject(project);
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const renderContent = () => {
    if (!activeWorkspaceId) {
      return <EmptyState message={t("common.workspace.pickInSidebar")} />;
    }

    if (projectsLoading) {
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
          projects={filtered.map((item) => ({ ...item }))}
          onOpenProject={(project) =>
            handleOpenProjectFromMap(project as unknown as Project)
          }
        />
      </div>
    );
  };

  return (
    <>
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

      <div className={contentContainerClassName}>
        <div className="h-full">{renderContent()}</div>
      </div>
    </>
  );
}
