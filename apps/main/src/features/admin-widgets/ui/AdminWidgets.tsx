import { PageHeader } from "@gridix/ui";
import { useAdminWidgetConfig } from "@/features/admin-widgets/model/useAdminWidgetConfig";
import { AdminWidgetsSkeleton } from "@/features/admin-widgets/ui/AdminWidgetsSkeleton";
import { WidgetSettingsCard } from "@/features/admin-widgets/ui/WidgetSettingsCard";
import { WidgetEmbedCodeCard } from "@/features/admin-widgets/ui/WidgetEmbedCodeCard";
import { WidgetLinksCard } from "@/features/admin-widgets/ui/WidgetLinksCard";
import { AdminAccessNotice } from "@/shared/ui/AdminAccessNotice";

const AdminWidgets = () => {
  const {
    t,
    loading,
    projects,
    hasAnyActiveProject,
    selectedProject,
    setSelectedProject,
    defaultLanguage,
    setDefaultLanguage,
    showAdvanced,
    setShowAdvanced,
    showFullProject,
    showFloatingButton,
    floatingButtonSide,
    setFloatingButtonSide,
    floatingButtonBottomOffset,
    setFloatingButtonBottomOffset,
    floatingButtonSideOffset,
    setFloatingButtonSideOffset,
    widgetContentMode,
    setWidgetContentMode,
    widgetSubProjectSlug,
    setWidgetSubProjectSlug,
    subProjects,
    subProjectsLoading,
    projectHasGenplan,
    projectGenplanLoading,
    handleToggleShowFullProject,
    handleToggleShowFloatingButton,
    openPreview,
    copyEmbedCode,
    embedCode,
    selectedProjectEmbedIdentifier,
    LANGUAGE_CONFIG,
    ADMIN_THEME,
  } = useAdminWidgetConfig();

  if (loading) {
    return <AdminWidgetsSkeleton />;
  }

  if (!hasAnyActiveProject) {
    return <AdminAccessNotice variant="subscription" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("adminWidgets.title")}
        description={t("adminWidgets.description")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WidgetSettingsCard
          t={t}
          projects={projects}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          defaultLanguage={defaultLanguage}
          setDefaultLanguage={setDefaultLanguage}
          showAdvanced={showAdvanced}
          setShowAdvanced={setShowAdvanced}
          showFullProject={showFullProject}
          showFloatingButton={showFloatingButton}
          floatingButtonSide={floatingButtonSide}
          setFloatingButtonSide={setFloatingButtonSide}
          floatingButtonBottomOffset={floatingButtonBottomOffset}
          setFloatingButtonBottomOffset={setFloatingButtonBottomOffset}
          floatingButtonSideOffset={floatingButtonSideOffset}
          setFloatingButtonSideOffset={setFloatingButtonSideOffset}
          widgetContentMode={widgetContentMode}
          setWidgetContentMode={setWidgetContentMode}
          widgetSubProjectSlug={widgetSubProjectSlug}
          setWidgetSubProjectSlug={setWidgetSubProjectSlug}
          subProjects={subProjects}
          subProjectsLoading={subProjectsLoading}
          projectHasGenplan={projectHasGenplan}
          projectGenplanLoading={projectGenplanLoading}
          handleToggleShowFullProject={handleToggleShowFullProject}
          handleToggleShowFloatingButton={handleToggleShowFloatingButton}
          openPreview={openPreview}
          copyEmbedCode={copyEmbedCode}
          languageConfig={LANGUAGE_CONFIG}
          theme={ADMIN_THEME}
        />
        <WidgetEmbedCodeCard
          title={t("adminWidgets.embedCode")}
          description={t("adminWidgets.embedCodeDesc")}
          embedCode={embedCode}
        />
      </div>

      <WidgetLinksCard
        title={t("adminWidgets.links")}
        description={t("adminWidgets.linksDesc")}
        selectedProject={selectedProject}
        selectedProjectLabel={t("adminWidgets.selectedProject")}
        selectedProjectEmbedIdentifier={selectedProjectEmbedIdentifier}
      />
    </div>
  );
};

export default AdminWidgets;
