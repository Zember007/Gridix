import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@gridix/ui";
import { Copy, Eye } from "lucide-react";
import { Language } from "@gridix/utils/lib";
import type { WidgetContentMode } from "@/features/admin-widgets/lib/generateEmbedCode";
import type { SubProject } from "@/features/genplan/model/types";
import { subProjectEmbedSlug } from "@/features/admin-widgets/lib/subProjectEmbedSlug";

type WidgetSettingsCardProps = {
  t: (key: string) => string;
  projects: Array<{ id: string; name: string }>;
  selectedProject: string;
  setSelectedProject: (value: string) => void;
  defaultLanguage: Language;
  setDefaultLanguage: (value: Language) => void;
  showAdvanced: boolean;
  setShowAdvanced: (value: boolean | ((prev: boolean) => boolean)) => void;
  showFullProject: boolean;
  showFloatingButton: boolean;
  floatingButtonSide: "left" | "right";
  setFloatingButtonSide: (value: "left" | "right") => void;
  floatingButtonBottomOffset: number;
  setFloatingButtonBottomOffset: (value: number) => void;
  floatingButtonSideOffset: number;
  setFloatingButtonSideOffset: (value: number) => void;
  widgetContentMode: WidgetContentMode;
  setWidgetContentMode: (value: WidgetContentMode) => void;
  widgetSubProjectSlug: string;
  setWidgetSubProjectSlug: (value: string) => void;
  subProjects: SubProject[];
  subProjectsLoading: boolean;
  projectHasGenplan: boolean;
  projectGenplanLoading: boolean;
  handleToggleShowFullProject: (checked: boolean) => void;
  handleToggleShowFloatingButton: (checked: boolean) => void;
  openPreview: () => void;
  copyEmbedCode: () => void;
  languageConfig: Record<string, { flag: string }>;
  theme: {
    primary: string;
    primaryHover: string;
    backgroundHover: string;
    textOnPrimary: string;
  };
};

export const WidgetSettingsCard = ({
  t,
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
  languageConfig,
  theme,
}: WidgetSettingsCardProps) => {
  return (
    <Card>
      <CardHeader className="px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6">
        <CardTitle>{t("adminWidgets.settings")}</CardTitle>
        <CardDescription>{t("adminWidgets.settingsDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 pt-0 md:px-6 md:pb-6">
        <div>
          <Label htmlFor="project-select">
            {t("adminWidgets.selectProject")}
          </Label>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger>
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="default-language">
            {t("adminWidgets.defaultLanguage")}
          </Label>
          <Select
            value={defaultLanguage}
            onValueChange={(value: Language) => setDefaultLanguage(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("adminWidgets.defaultLanguage")} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(languageConfig).map(([code, config]) => (
                <SelectItem key={code} value={code}>
                  {config.flag} {t(`language.${code}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-gray-500">
            {t("adminWidgets.defaultLanguageDesc")}
          </p>
        </div>

        <div>
          <Label htmlFor="widget-content-mode">
            {t("adminWidgets.widgetContentMode")}
          </Label>
          {projectGenplanLoading ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("adminWidgets.loading")}
            </p>
          ) : (
            <Select
              value={widgetContentMode}
              onValueChange={(value: WidgetContentMode) =>
                setWidgetContentMode(value)
              }
            >
              <SelectTrigger id="widget-content-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectHasGenplan ? (
                  <>
                    <SelectItem value="genplan">
                      {t("adminWidgets.widgetContentGenplan")}
                    </SelectItem>
                    <SelectItem value="objects">
                      {t("adminWidgets.widgetContentObjects")}
                    </SelectItem>
                    <SelectItem value="list">
                      {t("adminWidgets.widgetContentList")}
                    </SelectItem>
                    <SelectItem value="building">
                      {t("adminWidgets.widgetContentBuilding")}
                    </SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="facade">
                      {t("adminWidgets.widgetContentFacade")}
                    </SelectItem>
                    <SelectItem value="chess">
                      {t("adminWidgets.widgetContentChess")}
                    </SelectItem>
                    <SelectItem value="list">
                      {t("adminWidgets.widgetContentList")}
                    </SelectItem>
                    <SelectItem value="building">
                      {t("adminWidgets.widgetContentBuilding")}
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
          {!projectGenplanLoading && (
            <p className="mt-1 text-xs text-gray-500">
              {projectHasGenplan
                ? t("adminWidgets.widgetContentModeDesc")
                : t("adminWidgets.widgetContentModeDescNoGenplan")}
            </p>
          )}
          {widgetContentMode === "building" && (
            <div className="mt-3 space-y-2">
              <Label htmlFor="widget-subproject-select">
                {t("adminWidgets.widgetSubProjectLabel")}
              </Label>
              {subProjectsLoading ? (
                <p className="text-sm text-muted-foreground">
                  {t("adminWidgets.loading")}
                </p>
              ) : subProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("adminWidgets.widgetSubProjectEmpty")}
                </p>
              ) : (
                <Select
                  value={widgetSubProjectSlug || undefined}
                  onValueChange={setWidgetSubProjectSlug}
                >
                  <SelectTrigger id="widget-subproject-select">
                    <SelectValue
                      placeholder={t(
                        "adminWidgets.widgetSubProjectPlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {subProjects.map((sp) => {
                      const slug = subProjectEmbedSlug(sp);
                      const name = (sp.name ?? "").trim();
                      return (
                        <SelectItem key={sp.id} value={slug}>
                          {name.length > 0 ? name : slug}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-2">
          <div className="mb-2 flex items-center justify-between">
            <Label>{t("adminWidgets.widgetDisplay")}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="h-8 px-3 text-xs"
              style={{ borderColor: theme.primary, color: theme.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.backgroundHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {showAdvanced
                ? t("adminWidgets.hideAdvanced")
                : t("adminWidgets.showAdvanced")}
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("adminWidgets.showFullProject")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("adminWidgets.showFullProjectDesc")}
                  </p>
                </div>
                <Switch
                  checked={showFullProject}
                  onCheckedChange={handleToggleShowFullProject}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t("adminWidgets.showFloatingButton")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("adminWidgets.showFloatingButtonDesc")}
                  </p>
                </div>
                <Switch
                  checked={showFloatingButton}
                  onCheckedChange={handleToggleShowFloatingButton}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("adminWidgets.floatingButtonPosition")}</Label>
                <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <Label className="text-xs text-gray-500">
                      {t("adminWidgets.floatingButtonSide")}
                    </Label>
                    <Select
                      value={floatingButtonSide}
                      onValueChange={(value: "left" | "right") =>
                        setFloatingButtonSide(value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">
                          {t("adminWidgets.floatingButtonSideLeft")}
                        </SelectItem>
                        <SelectItem value="right">
                          {t("adminWidgets.floatingButtonSideRight")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("adminWidgets.floatingButtonBottomOffset")}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={floatingButtonBottomOffset}
                      onChange={(e) =>
                        setFloatingButtonBottomOffset(
                          Number(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">
                      {t("adminWidgets.floatingButtonSideOffset")}
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={floatingButtonSideOffset}
                      onChange={(e) =>
                        setFloatingButtonSideOffset(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {t("adminWidgets.floatingButtonPositionDesc")}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={openPreview}
            variant="outline"
            className="flex-1"
            style={{ borderColor: theme.primary, color: theme.primary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.backgroundHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            {t("adminWidgets.preview")}
          </Button>
          <Button
            onClick={copyEmbedCode}
            className="flex-1"
            style={{
              backgroundColor: theme.primary,
              color: theme.textOnPrimary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.primaryHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.primary;
            }}
          >
            <Copy className="mr-2 h-4 w-4" />
            {t("adminWidgets.copyCode")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
