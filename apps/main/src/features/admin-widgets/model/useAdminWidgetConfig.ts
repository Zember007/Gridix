import { useEffect, useMemo, useState } from "react";
import {
  ADMIN_THEME,
  getAdminThemeVariables,
  LANGUAGE_CONFIG,
  Language,
} from "@gridix/utils/lib";
import { toast } from "sonner";
import { useUserProjects } from "@/entities/project/queries/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { generateEmbedCode } from "@/features/admin-widgets/lib/generateEmbedCode";

export const useAdminWidgetConfig = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { projects, loading } = useUserProjects(user?.id);

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
    if (projects.length > 0) {
      setSelectedProject(projects?.[0]?.id || "");
    }
  }, [projects]);

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
    navigator.clipboard.writeText(embedCode);
    toast.success(t("adminWidgets.codeCopied"));
  };

  const openPreview = () => {
    const baseUrl = window.location.origin;
    let previewUrl = "";
    if (selectedProject === "all") {
      previewUrl = `${baseUrl}/embed/projects/${user?.id}?lang=${defaultLanguage}`;
    } else if (selectedProjectEmbedIdentifier) {
      previewUrl = `${baseUrl}/embed/project/${selectedProjectEmbedIdentifier}?lang=${defaultLanguage}`;
    }
    if (!previewUrl) return;
    window.open(previewUrl, "_blank");
  };

  return {
    t,
    loading,
    projects,
    user,
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
