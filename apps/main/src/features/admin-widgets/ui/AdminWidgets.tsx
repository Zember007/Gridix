import { Spinner } from "@/shared/ui/Spinner";
import { useAdminWidgetConfig } from "@/features/admin-widgets/model/useAdminWidgetConfig";
import { WidgetSettingsCard } from "@/features/admin-widgets/ui/WidgetSettingsCard";
import { WidgetEmbedCodeCard } from "@/features/admin-widgets/ui/WidgetEmbedCodeCard";
import { WidgetLinksCard } from "@/features/admin-widgets/ui/WidgetLinksCard";

const AdminWidgets = () => {
  const {
    t,
    loading,
    projects,
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
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="md" style={{ borderColor: ADMIN_THEME.primary }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("adminWidgets.title")}</h1>
        <p className="text-gray-600">{t("adminWidgets.description")}</p>
      </div>

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
