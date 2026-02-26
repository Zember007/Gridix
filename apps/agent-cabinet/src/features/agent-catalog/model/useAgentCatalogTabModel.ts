import { useEffect, useMemo, useState } from "react";
import type { SharedProject } from "@gridix/ui";
import { useWorkspace } from "@gridix/utils/react";
import { useLanguage } from "@/shared/lib/language";
import { Project, toSharedProject } from "@/entities/project";
import { getProjectDrawer } from "../api/catalog-api";
import { createShareUrl, getMainAppUrl } from "../lib/project-share";
import { useAgentCatalogQuery } from "./useAgentCatalogQuery";

export function useAgentCatalogTabModel() {
  const { language, t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected =
    availableWorkspaces.find(
      (workspace) => workspace.id === activeWorkspaceId,
    ) ?? null;
  const baseUrl = useMemo(() => getMainAppUrl(), []);

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [drawerProject, setDrawerProject] = useState<SharedProject | null>(
    null,
  );

  const projectsQuery = useAgentCatalogQuery(activeWorkspaceId);

  const filtered = useMemo(() => {
    const rows = projectsQuery.data ?? [];
    const value = searchQuery.trim().toLowerCase();
    if (!value) return rows;

    return rows.filter((project) => {
      return (
        String(project.name ?? "")
          .toLowerCase()
          .includes(value) ||
        String(project.address ?? "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [projectsQuery.data, searchQuery]);

  const shareUrlForProject = (project: Project): string | null => {
    return createShareUrl({
      baseUrl,
      language,
      slug: project.slug,
      activeWorkspaceId,
    });
  };

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setDrawerProject(toSharedProject(project));
  };

  const handleCloseDrawer = () => {
    setSelectedProject(null);
    setDrawerProject(null);
  };

  const handleShareProject = (sharedProject: SharedProject) => {
    const project = (projectsQuery.data ?? []).find(
      (item) => item.id === sharedProject.id,
    );
    if (!project) return;

    const shareUrl = shareUrlForProject(project);
    if (!shareUrl) return;

    if (navigator.share) {
      void navigator.share({ title: project.name, url: shareUrl });
    } else {
      void navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleOpenPublicPage = (sharedProject: SharedProject) => {
    const project = (projectsQuery.data ?? []).find(
      (item) => item.id === sharedProject.id,
    );
    if (!project) return;

    const shareUrl = shareUrlForProject(project);
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!activeWorkspaceId || !selectedProject) return;
    let cancelled = false;

    void (async () => {
      try {
        const response = await getProjectDrawer(
          activeWorkspaceId,
          selectedProject.id,
        );
        if (cancelled) return;
        if (!response?.success || !response.project) {
          throw new Error(response?.error ?? "Failed");
        }

        const api = response.project;
        setDrawerProject({
          id: String(api.id),
          name: String(api.name ?? ""),
          location: api.location ?? undefined,
          imageUrl: api.imageUrl ?? undefined,
          description: api.description ?? undefined,
          floors:
            typeof api.floors === "number"
              ? api.floors
              : api.floors
                ? Number(api.floors)
                : undefined,
          minPrice: api.minPrice ?? undefined,
          yield: api.yield ?? undefined,
          stats: api.stats ?? undefined,
          media: api.media ?? undefined,
          constructionProgress: api.constructionProgress ?? undefined,
          partnershipStatus: "active",
          partnershipSettings: api.partnershipSettings ?? undefined,
          commissionPercent:
            api.partnershipSettings?.commissionType === "percent"
              ? Number(api.partnershipSettings?.commissionValue ?? 5)
              : undefined,
          commissionCondition:
            api.partnershipSettings?.payoutCondition ?? undefined,
        });
      } catch (error) {
        console.error("Failed to load project drawer", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, selectedProject]);

  return {
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
  };
}
