import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_THEME,
  getAdminThemeVariables,
  LANGUAGE_CONFIG,
  Language,
} from "@gridix/utils/lib";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateEmbedCode } from "@/features/admin-widgets/lib/generateEmbedCode";
import { useAdminAccess } from "@/entities/admin-access";

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
    ],
  );

  const copyEmbedCode = () => {
    if (!selectedProjectEmbedIdentifier) {
      toast.error("No active project available for widget generation.");
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
    const baseUrl = window.location.origin;
    let previewUrl = "";
    if (selectedProjectEmbedIdentifier) {
      previewUrl = `${baseUrl}/embed/project/${selectedProjectEmbedIdentifier}?lang=${defaultLanguage}`;
    }
    if (!previewUrl) return;
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
    LANGUAGE_CONFIG,
    ADMIN_THEME,
  };
};
