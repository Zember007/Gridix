import { useEffect, useMemo, useState } from "react";
import type { SharedProject } from "@gridix/ui";
import { useWorkspace } from "@gridix/utils/react";
import { useLanguage } from "@/shared/lib/language";
import { Project, toSharedProject } from "@/entities/project";
import { getProjectDrawer } from "../api/catalog-api";
import { mapDrawerProject } from "../lib/map-drawer-project";
import { createShareUrl, getMainAppUrl } from "../lib/project-share";
import { useAgentCatalogQuery } from "./useAgentCatalogQuery";

const EMPTY_PROJECTS: Project[] = [];

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
  const projects = projectsQuery.data ?? EMPTY_PROJECTS;
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedSearch) return projects;

    return projects.filter((project) => {
      return (
        String(project.name ?? "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(project.address ?? "")
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [normalizedSearch, projects]);

  const shareUrlForProject = (project: Project): string | null => {
    return createShareUrl({
      baseUrl,
      language,
      slug: project.slug,
      activeWorkspaceId,
    });
  };

  const getProjectWithShareUrl = (sharedProjectId: string) => {
    const project = projects.find((item) => item.id === sharedProjectId);
    if (!project) return null;

    const shareUrl = shareUrlForProject(project);
    if (!shareUrl) return null;

    return { project, shareUrl };
  };

  const handleOpenProject = (project: Project) => {
    // Open drawer immediately with list data; detailed payload is loaded in effect below.
    setSelectedProject(project);
    setDrawerProject(toSharedProject(project));
  };

  const handleCloseDrawer = () => {
    setSelectedProject(null);
    setDrawerProject(null);
  };

  const handleShareProject = (sharedProject: SharedProject) => {
    const payload = getProjectWithShareUrl(sharedProject.id);
    if (!payload) return;
    const { project, shareUrl } = payload;

    if (navigator.share) {
      void navigator.share({ title: project.name, url: shareUrl });
    } else {
      void navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleOpenPublicPage = (sharedProject: SharedProject) => {
    const payload = getProjectWithShareUrl(sharedProject.id);
    if (!payload) return;
    window.open(payload.shareUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!activeWorkspaceId || !selectedProject) return;
    // Protect state from out-of-order async responses when selection changes.
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

        setDrawerProject(mapDrawerProject(response.project));
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
