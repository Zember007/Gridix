import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_THEME,
  getAdminThemeVariables,
  LANGUAGE_CONFIG,
  Language,
} from "@gridix/utils/lib";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  generateEmbedCode,
  type WidgetContentMode,
} from "@/features/admin-widgets/lib/generateEmbedCode";
import { useAdminAccess } from "@/entities/admin-access";
import { useAdminWidgetSubProjects } from "@/features/admin-widgets/model/useAdminWidgetSubProjects";
import { useProjectHasMasterplan } from "@/features/admin-widgets/model/useProjectHasMasterplan";
import { subProjectEmbedSlug } from "@/features/admin-widgets/lib/subProjectEmbedSlug";

export const useAdminWidgetConfig = () => {
  const { t } = useLanguage();
  const adminAccess = useAdminAccess();
  const loading = adminAccess?.loading ?? false;
  const projects = (adminAccess?.activeProjects ?? []).map((project) => ({
    id: project.id,
    name: project.name,
    slug: project.slug,
  }));
  const hasAnyActiveProject = adminAccess?.hasAnyActiveProject ?? false;

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [defaultLanguage, setDefaultLanguage] = useState<Language>("en");
  const [showFullProject, setShowFullProject] = useState<boolean>(true);
  const [showFloatingButton, setShowFloatingButton] = useState<boolean>(true);
  const [floatingButtonSide, setFloatingButtonSide] = useState<
    "left" | "right"
  >("right");
  const [floatingButtonBottomOffset, setFloatingButtonBottomOffset] =
    useState<number>(40);
  const [floatingButtonSideOffset, setFloatingButtonSideOffset] =
    useState<number>(32);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [widgetContentMode, setWidgetContentMode] =
    useState<WidgetContentMode>("genplan");
  const [widgetSubProjectSlug, setWidgetSubProjectSlug] = useState<string>("");

  const subProjectsQuery = useAdminWidgetSubProjects(
    selectedProject || undefined,
  );
  const subProjects = subProjectsQuery.data ?? [];
  const subProjectsLoading = subProjectsQuery.isLoading;

  const masterplanQuery = useProjectHasMasterplan(selectedProject || undefined);
  const projectHasGenplan = masterplanQuery.data === true;
  const projectGenplanLoading = masterplanQuery.isLoading;

  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  useEffect(() => {
    if (!projects.length) {
      setSelectedProject("");
      return;
    }

    if (!projects.some((project) => project.id === selectedProject)) {
      setSelectedProject(projects[0]?.id || "");
    }
  }, [projects, selectedProject]);

  useEffect(() => {
    setWidgetSubProjectSlug("");
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedProject || masterplanQuery.isLoading) return;
    const has = masterplanQuery.data === true;
    setWidgetContentMode((prev) => {
      if (has) {
        const allowed: WidgetContentMode[] = [
          "genplan",
          "objects",
          "list",
          "building",
        ];
        return allowed.includes(prev) ? prev : "genplan";
      }
      const allowed: WidgetContentMode[] = [
        "facade",
        "chess",
        "list",
        "building",
      ];
      return allowed.includes(prev) ? prev : "facade";
    });
  }, [selectedProject, masterplanQuery.isLoading, masterplanQuery.data]);

  useEffect(() => {
    if (!widgetSubProjectSlug || subProjectsQuery.isLoading) return;
    const valid = subProjects.some(
      (sp) => subProjectEmbedSlug(sp) === widgetSubProjectSlug,
    );
    if (!valid) setWidgetSubProjectSlug("");
  }, [subProjects, widgetSubProjectSlug, subProjectsQuery.isLoading]);

  const selectedProjectData = projects.find(
    (project) => project.id === selectedProject,
  );

  const selectedProjectEmbedIdentifier =
    selectedProjectData?.slug && selectedProjectData.slug.trim().length > 0
      ? selectedProjectData.slug
      : selectedProject
        ? `id/${selectedProject}`
        : "";

  const ensureAtLeastOneOption = (
    nextShowFull: boolean,
    nextShowButton: boolean,
  ): boolean => {
    if (!nextShowFull && !nextShowButton) {
      toast.error(t("adminWidgets.atLeastOneOptionRequired"));
      return false;
    }
    return true;
  };

  const handleToggleShowFullProject = (checked: boolean) => {
    if (!ensureAtLeastOneOption(checked as boolean, showFloatingButton)) return;
    setShowFullProject(checked as boolean);
  };

  const handleToggleShowFloatingButton = (checked: boolean) => {
    if (!ensureAtLeastOneOption(showFullProject, checked as boolean)) return;
    setShowFloatingButton(checked as boolean);
  };

  const embedCode = useMemo(
    () =>
      generateEmbedCode({
        origin: window.location.origin,
        defaultLanguage,
        showFullProject,
        showFloatingButton,
        floatingButtonSide,
        floatingButtonBottomOffset,
        floatingButtonSideOffset,
        selectedProject,
        selectedProjectEmbedIdentifier,
        widgetContentMode,
        widgetSubProjectSlug,
      }),
    [
      defaultLanguage,
      showFullProject,
      showFloatingButton,
      floatingButtonSide,
      floatingButtonBottomOffset,
      floatingButtonSideOffset,
      selectedProject,
      selectedProjectEmbedIdentifier,
      widgetContentMode,
      widgetSubProjectSlug,
    ],
  );

  const copyEmbedCode = () => {
    if (!selectedProjectEmbedIdentifier) {
      toast.error("No active project available for widget generation.");
      return;
    }
    if (
      widgetContentMode === "building" &&
      !widgetSubProjectSlug.trim().length
    ) {
      toast.error(t("adminWidgets.subProjectSelectRequired"));
      return;
    }
    navigator.clipboard.writeText(embedCode);
    toast.success(t("adminWidgets.codeCopied"));
  };

  const openPreview = () => {
    if (!selectedProjectEmbedIdentifier) {
      toast.error("No active project available for preview.");
      return;
    }
    if (
      widgetContentMode === "building" &&
      !widgetSubProjectSlug.trim().length
    ) {
      toast.error(t("adminWidgets.subProjectSelectRequired"));
      return;
    }
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set("lang", defaultLanguage);
    if (widgetContentMode === "objects" || widgetContentMode === "chess") {
      params.set("view", "chess");
    } else if (widgetContentMode === "list") {
      params.set("view", "list");
    }

    let path = `/embed/project/${selectedProjectEmbedIdentifier}`;
    if (widgetContentMode === "building") {
      const seg = encodeURIComponent(widgetSubProjectSlug.trim());
      path = `${path}/p/${seg}`;
    }

    const previewUrl = `${baseUrl}${path}?${params.toString()}`;
    window.open(previewUrl, "_blank");
  };

  return {
    t,
    loading,
    projects,
    hasAnyActiveProject,
    selectedProject,
    setSelectedProject,
    defaultLanguage,
    setDefaultLanguage,
    showFullProject,
    showFloatingButton,
    floatingButtonSide,
    setFloatingButtonSide,
    floatingButtonBottomOffset,
    setFloatingButtonBottomOffset,
    floatingButtonSideOffset,
    setFloatingButtonSideOffset,
    showAdvanced,
    setShowAdvanced,
    handleToggleShowFullProject,
    handleToggleShowFloatingButton,
    openPreview,
    copyEmbedCode,
    embedCode,
    selectedProjectEmbedIdentifier,
    widgetContentMode,
    setWidgetContentMode,
    widgetSubProjectSlug,
    setWidgetSubProjectSlug,
    subProjects,
    subProjectsLoading,
    projectHasGenplan,
    projectGenplanLoading,
    LANGUAGE_CONFIG,
    ADMIN_THEME,
  };
};
