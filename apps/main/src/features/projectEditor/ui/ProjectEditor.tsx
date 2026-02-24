import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@gridix/ui";
import {
  ArrowLeft,
  Building2,
  FileText,
  Image,
  Save,
  Upload,
  X,
} from "lucide-react";
import {
  ADMIN_THEME,
  CURRENCIES,
  CurrencyType,
  DEFAULT_CURRENCY,
  getAdminThemeVariables,
  Language,
  LANGUAGE_CONFIG,
  SUPPORTED_LANGUAGES,
} from "@gridix/utils/lib";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useLanguage, useLanguageNavigation } from "@gridix/utils/react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useProjectInEditorScope } from "@/features/projectEditor/hooks/useProjectInEditorScope";
import {
  uploadProjectPdf,
  removeProjectPdf,
} from "@/features/projectEditor/api/projectEditorApi";
import {
  ProjectEditorDataProvider,
  useProjectEditorDataContext,
} from "@/features/projectEditor/context/ProjectEditorDataContext";
import ProjectApartmentsManager from "@/components/projects/ProjectApartmentsManager";
import BuildingImageEditor from "@/components/visualization/BuildingImageEditor";
import AllFieldsManager from "@/components/admin/AllFieldsManager";
import ApartmentPhotosManager from "@/components/apartment/ApartmentPhotosManager";

import ProjectDomainSettings from "@/components/admin/ProjectDomainSettings";
import { ProjectEditorSidebar } from "@/shared/ui/sidebar-component";
import { useSearchParams } from "react-router-dom";
import ProjectFloorsManager from "@/components/projects/ProjectFloorsManager";
import { ProjectPriceManager } from "@/components/projects/ProjectPriceManager";
import { Spinner } from "@/shared/ui/Spinner";
import {
  isDevTourMode,
  startProjectChecklist,
  startProjectEditorTour,
  trackUsertourEvent,
} from "@gridix/utils/integrations";
import {
  DEFAULT_PROJECT_EDITOR_PROJECT,
  type ProjectEditorProject,
} from "@/features/projectEditor/model/types";

interface ProjectEditorProps {
  projectId: string;
  isNew: boolean;
  onBack: () => void;
}

const parseAvailableLanguages = (value: unknown): Language[] => {
  if (!Array.isArray(value)) return SUPPORTED_LANGUAGES;
  const filtered = value.filter(
    (v): v is Language => typeof v === "string" && v in LANGUAGE_CONFIG,
  );
  return filtered.length > 0 ? filtered : SUPPORTED_LANGUAGES;
};

const ProjectEditor = ({ projectId, isNew, onBack }: ProjectEditorProps) => {
  const [project, setProject] = useState<ProjectEditorProject>(
    DEFAULT_PROJECT_EDITOR_PROJECT,
  );
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [accessError, setAccessError] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const { navigate } = useLanguageNavigation();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { isManager, developerIds } = useUserRole();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { project: cachedProject, loading: projectLoading } =
    useProjectInEditorScope(projectId);
  const editorDataContext = useProjectEditorDataContext();
  const [searchParams] = useSearchParams();
  const startedEditorTourRef = useRef(false);
  const startedProjectChecklistRef = useRef(false);

  // Mobile menu state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Читаем query параметры и устанавливаем активную вкладку
  useEffect(() => {
    const page = searchParams.get("page");
    if (page) {
      // Валидируем, что page является допустимой вкладкой
      const validTabs = [
        "basic",
        "building",
        "apartments",
        "floors",
        "photos",
        "fields",
        "domains",
      ];
      if (validTabs.includes(page)) {
        setActiveTab(page);
      }
    }
  }, [searchParams]);

  const projectSource = editorDataContext?.data?.project ?? cachedProject;

  const mapDbProjectToEditor = useCallback((row: typeof cachedProject) => {
    if (!row) return;
    setProject({
      id: row.id,
      name: row.name || "",
      description: row.description || "",
      address: row.address || "",
      floors: row.floors || 1,
      has_parking: row.has_parking || false,
      has_commercial: row.has_commercial || false,
      building_image_url: row.building_image_url,
      latitude: row.latitude,
      longitude: row.longitude,
      currency: (row.currency as CurrencyType) || DEFAULT_CURRENCY,
      installment_enabled: row.installment_enabled || false,
      min_down_payment_percent: row.min_down_payment_percent || 20,
      max_installment_months: row.max_installment_months || 24,
      pdf_presentation_url: row.pdf_presentation_url,
      theme_color:
        ((row as unknown as Record<string, unknown>).theme_color as string) ||
        "#000000",
      project_type:
        ((row as unknown as Record<string, unknown>).project_type as
          | "building"
          | "object"
          | null) || "building",
      facade_open:
        ((row as unknown as Record<string, unknown>).facade_open as boolean) ||
        false,
      available_languages: parseAvailableLanguages(
        (row as unknown as Record<string, unknown>).available_languages,
      ),
    });
  }, []);

  useEffect(() => {
    if (isNew || !projectId) return;
    const source = projectSource;
    if (!source) return;

    try {
      const canEdit =
        user &&
        (source.user_id === user.id ||
          (isManagerMode &&
            activeWorkspaceId &&
            source.user_id === activeWorkspaceId) ||
          (isManager && developerIds.includes(source.user_id ?? "")));

      if (!canEdit) {
        setAccessError(t("projectEditor.noEditRights"));
        return;
      }
      mapDbProjectToEditor(source);
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error(t("projectEditor.errorLoading"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, projectSource?.id, isNew, mapDbProjectToEditor]);

  // Project editor onboarding: usertour tracks "once" internally (no Supabase tracking needed)
  useEffect(() => {
    if (authLoading) return;

    if (!user?.id) return;
    if (isNew) return;
    if (!project?.id) return;
    if (startedEditorTourRef.current) return;

    startedEditorTourRef.current = true;
    const run = async () => {
      try {
        await startProjectEditorTour({
          userId: user.id,
          email: userProfile?.email ?? user.email ?? null,
          name:
            userProfile?.full_name ??
            (typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : null),
          signedUpAt: user.created_at ?? userProfile?.created_at ?? null,
          companyName:
            userProfile?.company_name ??
            (typeof user.user_metadata?.company_name === "string"
              ? user.user_metadata.company_name
              : null),
          phone:
            userProfile?.phone ??
            (typeof user.user_metadata?.phone === "string"
              ? user.user_metadata.phone
              : null),
          accountType:
            typeof user.user_metadata?.account_type === "string"
              ? user.user_metadata.account_type
              : null,
        });
      } catch (e) {
        console.warn("Failed to start project editor onboarding tour:", e);
      }
    };

    void run();
  }, [authLoading, isNew, project?.id, user, userProfile]);

  // Project checklist: once per user (Usertour-side), open on first editor entry
  useEffect(() => {
    if (authLoading) return;

    const devTour = isDevTourMode();
    // allow re-opening in dev mode
    if (devTour && (!project?.id || isNew)) {
      startedProjectChecklistRef.current = false;
      return;
    }

    if (!user?.id) return;
    if (isNew) return;
    if (!project?.id) return;
    if (startedProjectChecklistRef.current) return;

    startedProjectChecklistRef.current = true;
    const run = async () => {
      try {
        await startProjectChecklist({
          userId: user.id,
          email: userProfile?.email ?? user.email ?? null,
          name:
            userProfile?.full_name ??
            (typeof user.user_metadata?.full_name === "string"
              ? user.user_metadata.full_name
              : null),
          signedUpAt: user.created_at ?? userProfile?.created_at ?? null,
          companyName:
            userProfile?.company_name ??
            (typeof user.user_metadata?.company_name === "string"
              ? user.user_metadata.company_name
              : null),
          phone:
            userProfile?.phone ??
            (typeof user.user_metadata?.phone === "string"
              ? user.user_metadata.phone
              : null),
          accountType:
            typeof user.user_metadata?.account_type === "string"
              ? user.user_metadata.account_type
              : null,
        });
      } catch (e) {
        console.warn("Failed to start project checklist:", e);
        startedProjectChecklistRef.current = false;
      }
    };

    void run();
  }, [authLoading, isNew, project?.id, user, userProfile]);

  // Reset per-project guard when switching projects (and allow re-run on navigation)
  useEffect(() => {
    startedEditorTourRef.current = false;
    startedProjectChecklistRef.current = false;
  }, [project?.id]);

  // Auto-complete signal for "basic info ready" (live and saved)
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;
    if (isNew) return;

    const hasAddress =
      typeof project.address === "string" && project.address.trim().length > 0;
    const hasLat =
      typeof project.latitude === "number" && !Number.isNaN(project.latitude);
    const hasLon =
      typeof project.longitude === "number" && !Number.isNaN(project.longitude);
    const hasPdf =
      typeof project.pdf_presentation_url === "string" &&
      project.pdf_presentation_url.length > 0;

    if (!hasAddress || !hasLat || !hasLon || !hasPdf) return;

    void trackUsertourEvent({
      eventName: "gridix_project_basic_info_ready",
      properties: {
        project_id: project.id || projectId,
      },
      onceKey: "gridix_project_basic_info_ready",
    });
  }, [
    authLoading,
    isNew,
    project.address,
    project.latitude,
    project.longitude,
    project.pdf_presentation_url,
    project.id,
    projectId,
    user?.id,
  ]);

  const handleSave = async () => {
    if (!project.name.trim()) {
      toast.error(t("projectEditor.projectNameRequired"));
      return;
    }

    if (!user) {
      toast.error(t("projectEditor.authRequired"));
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        name: project.name.trim(),
        description: project.description || null,
        address: project.address || null,
        floors: project.floors,
        has_parking: project.has_parking,
        has_commercial: project.has_commercial,
        building_image_url: project.building_image_url,
        latitude: project.latitude,
        longitude: project.longitude,
        currency: project.currency,
        installment_enabled: project.installment_enabled,
        min_down_payment_percent: project.min_down_payment_percent,
        max_installment_months: project.max_installment_months,
        pdf_presentation_url: project.pdf_presentation_url,
        theme_color: project.theme_color,
        project_type: project.project_type || "building",
        facade_open: project.facade_open,
        available_languages: project.available_languages,
        updated_at: new Date().toISOString(),
        ...(isNew && { user_id: user.id }), // Добавляем user_id только при создании
      };

      if (isNew) {
        const { data, error } = await supabase
          .from("projects")
          .insert([saveData])
          .select()
          .single();

        if (error) throw error;

        setProject((prev) => ({ ...prev, id: data.id }));
        toast.success(t("projectEditor.projectCreated"));
        void trackUsertourEvent({
          eventName: "gridix_project_created",
          properties: { project_id: data.id },
          onceKey: "gridix_project_created",
        });
        navigate(`/admin/project/${data.id}`);
      } else {
        const canEdit =
          user &&
          (cachedProject?.user_id === user.id ||
            (isManagerMode &&
              activeWorkspaceId &&
              cachedProject?.user_id === activeWorkspaceId) ||
            (isManager &&
              cachedProject?.user_id &&
              developerIds.includes(cachedProject.user_id)));

        if (!canEdit) {
          throw new Error("У вас нет прав на редактирование этого проекта");
        }

        const { error } = await supabase
          .from("projects")
          .update(saveData)
          .eq("id", project.id);

        if (error) throw error;
        toast.success(t("projectEditor.projectSaved"));
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(t("projectEditor.errorSaving"));
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("Text");
    const parts = text.split(",").map((part) => part.trim());

    if (parts.length === 2) {
      const [parsedLat, parsedLon] = parts;
      setProject((prev) => ({
        ...prev,
        latitude: parseFloat(parsedLat ?? "0"),
        longitude: parseFloat(parsedLon ?? "0"),
      }));
      e.preventDefault(); // предотвращаем вставку в одно поле
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (!user || isNew) {
      toast.error(t("projectEditor.saveProjectFirst"));
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error(t("projectEditor.onlyPdfAllowed"));
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t("projectEditor.fileTooLarge"));
      return;
    }

    setUploadingPdf(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
      });
      if (pdfDoc.getPageCount() === 0) {
        toast.error(t("projectEditor.invalidPdf"));
        setUploadingPdf(false);
        return;
      }

      const { publicUrl } = await uploadProjectPdf(project.id, file);
      setProject((prev) => ({ ...prev, pdf_presentation_url: publicUrl }));
      toast.success(t("projectEditor.pdfUploadSuccess"));
      void editorDataContext?.refresh();
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast.error(t("projectEditor.pdfUploadError"));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleRemovePdf = async () => {
    if (!user || !project.pdf_presentation_url) return;
    try {
      await removeProjectPdf(project.id, project.pdf_presentation_url);
      setProject((prev) => ({ ...prev, pdf_presentation_url: null }));
      toast.success(t("projectEditor.pdfRemoveSuccess"));
      void editorDataContext?.refresh();
    } catch (error) {
      console.error("Error removing PDF:", error);
      toast.error(t("projectEditor.pdfRemoveError"));
    }
  };

  const [isCollapsed, setIsCollapsed] = useState(true);

  const isEditorDataLoading =
    !isNew && (editorDataContext?.loading ?? projectLoading);

  if (accessError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">
              {t("projectEditor.accessDenied")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">{accessError}</p>
            <Button onClick={onBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("projectEditor.back")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Map activeTab to sidebar sections
  const getSidebarSection = (tab: string) => {
    switch (tab) {
      case "basic":
        return "general";
      case "building":
        return "general";
      case "apartments":
        return "apartments";
      case "floors":
        return "floorplan";
      case "photos":
        return "photos";
      case "fields":
        return "fields";
      case "domains":
        return "domains";
      default:
        return "general";
    }
  };

  const handleSidebarSectionChange = (section: string) => {
    switch (section) {
      case "general":
        setActiveTab("basic");
        break;
      case "apartments":
        setActiveTab("apartments");
        break;
      case "floorplan":
        setActiveTab("floors");
        break;
      case "photos":
        setActiveTab("photos");
        break;
      case "fields":
        setActiveTab("fields");
        break;
      case "domains":
        setActiveTab("domains");
        break;
      default:
        setActiveTab("basic");
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <ProjectEditorSidebar
        onSectionChange={handleSidebarSectionChange}
        activeTab={getSidebarSection(activeTab ?? "basic")}
        userEmail={userProfile?.email || user?.email || "Unknown user"}
        projectType={project.project_type ?? "building"}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div
        className={`flex flex-1 flex-col bg-background transition-all duration-300 ${isCollapsed ? "md:ml-28 md:max-w-[calc(100vw-7rem)]" : "md:ml-64 md:max-w-[calc(100vw-16rem)]"}`}
      >
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="project_back_usertour"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">
                    {t("projectEditor.back")}
                  </span>
                </Button>
                <div className="hidden lg:block">
                  <h1 className="text-2xl font-bold">
                    {isNew ? t("projectEditor.newProject") : project.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {isNew
                      ? t("projectEditor.createNewProject")
                      : t("projectEditor.editProject")}
                  </p>
                </div>
                <div className="lg:hidden">
                  <h1 className="text-lg font-bold">
                    {isNew ? t("projectEditor.newProject") : project.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {isNew
                      ? t("projectEditor.createNewProject")
                      : t("projectEditor.editProject")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="project_save_usertour"
                  style={{
                    backgroundColor: ADMIN_THEME.primary,
                    color: ADMIN_THEME.textOnPrimary,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor =
                        ADMIN_THEME.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor =
                        ADMIN_THEME.primary;
                    }
                  }}
                >
                  <Save className="h-4 w-4" />
                  <span className="ml-2 hidden sm:inline">
                    {saving
                      ? t("projectEditor.saving")
                      : t("projectEditor.save")}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isEditorDataLoading ? (
          <div className="flex min-h-full items-center justify-center">
            <Spinner size="md" />
          </div>
        ) : (
          <div className="project_editor_content_usertour flex-1 overflow-y-auto px-6 py-4 lg:py-6">
            {/* Show content based on activeTab without Tabs wrapper */}

            {(activeTab === "basic" || activeTab === "building") && (
              <div className="space-y-6">
                {/* Sub-navigation for basic/building sections - only on desktop */}
                <div className="mb-6 hidden gap-2 lg:flex">
                  <Button
                    variant={activeTab === "basic" ? "default" : "outline"}
                    onClick={() => setActiveTab("basic")}
                    className="flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    {t("projectEditor.basicInfo")}
                  </Button>
                  <Button
                    variant={activeTab === "building" ? "default" : "outline"}
                    onClick={() => setActiveTab("building")}
                    disabled={isNew}
                    className="flex items-center gap-2"
                  >
                    <Image className="h-4 w-4" />
                    {project.project_type === "object"
                      ? "Object Image"
                      : t("projectEditor.buildingImage")}
                  </Button>
                </div>

                {activeTab === "basic" && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("projectEditor.basicInfo")}</CardTitle>
                        <CardDescription>
                          {t("projectEditor.basicInfo")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="name">
                            {t("projectEditor.projectName")} *
                          </Label>
                          <Input
                            id="name"
                            value={project.name}
                            onChange={(e) =>
                              setProject((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder={t("projectEditor.projectName")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">
                            {t("projectEditor.description")}
                          </Label>
                          <Textarea
                            id="description"
                            value={project.description}
                            onChange={(e) =>
                              setProject((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder={t("projectEditor.description")}
                            rows={3}
                          />
                        </div>
                        <div>
                          <Label htmlFor="address">
                            {t("projectEditor.address")}
                          </Label>
                          <Input
                            id="address"
                            value={project.address}
                            onChange={(e) =>
                              setProject((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            placeholder={t("projectEditor.address")}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>{t("projectEditor.availableLanguages")}</Label>
                          <p className="text-xs text-gray-500">
                            {t("projectEditor.availableLanguagesDesc")}
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {SUPPORTED_LANGUAGES.map((code) => {
                              const checked =
                                project.available_languages.includes(code);
                              const id = `available-language-${code}`;
                              return (
                                <div
                                  key={code}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={id}
                                    checked={checked}
                                    onCheckedChange={(next) => {
                                      const shouldEnable = next === true;
                                      if (
                                        !shouldEnable &&
                                        project.available_languages.length <= 1
                                      ) {
                                        toast.error(
                                          t("projectEditor.atLeastOneLanguage"),
                                        );
                                        return;
                                      }

                                      setProject((prev) => {
                                        const current =
                                          prev.available_languages;
                                        if (shouldEnable) {
                                          if (current.includes(code))
                                            return prev;
                                          return {
                                            ...prev,
                                            available_languages: [
                                              ...current,
                                              code,
                                            ],
                                          };
                                        }

                                        if (!current.includes(code))
                                          return prev;
                                        if (current.length <= 1) return prev;
                                        return {
                                          ...prev,
                                          available_languages: current.filter(
                                            (l) => l !== code,
                                          ),
                                        };
                                      });
                                    }}
                                  />
                                  <Label
                                    htmlFor={id}
                                    className="cursor-pointer select-none"
                                  >
                                    <span className="mr-2">
                                      {LANGUAGE_CONFIG[code].flag}
                                    </span>
                                    {LANGUAGE_CONFIG[code].name}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="project-type-desktop">
                              {t("projectEditor.projectType")}
                            </Label>
                            <Select
                              value={project.project_type || "building"}
                              onValueChange={(v: "building" | "object") =>
                                setProject((prev) => ({
                                  ...prev,
                                  project_type: v,
                                }))
                              }
                            >
                              <SelectTrigger id="project-type-desktop">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="building">
                                  {t("projectEditor.typeBuilding")}
                                </SelectItem>
                                <SelectItem value="object">
                                  {t("projectEditor.typeObject")}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {project.project_type !== "object" && (
                            <div>
                              <Label htmlFor="floors">
                                {t("projectEditor.floors")} *
                              </Label>
                              <Input
                                id="floors"
                                type="number"
                                min="1"
                                value={project.floors}
                                onChange={(e) =>
                                  setProject((prev) => ({
                                    ...prev,
                                    floors: parseInt(e.target.value) || 1,
                                  }))
                                }
                              />
                            </div>
                          )}
                        </div>

                        {/* Дополнительные типы помещений */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="has-parking"
                              checked={project.has_parking}
                              onCheckedChange={(checked) =>
                                setProject((prev) => ({
                                  ...prev,
                                  has_parking: checked,
                                }))
                              }
                            />
                            <Label htmlFor="has-parking">
                              {t("projectEditor.hasParking")}
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="has-commercial"
                              checked={project.has_commercial}
                              onCheckedChange={(checked) =>
                                setProject((prev) => ({
                                  ...prev,
                                  has_commercial: checked,
                                }))
                              }
                            />
                            <Label htmlFor="has-commercial">
                              {t("projectEditor.hasCommercial")}
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="facade-open-desktop"
                              checked={project.facade_open}
                              onCheckedChange={(checked) =>
                                setProject((prev) => ({
                                  ...prev,
                                  facade_open: checked,
                                }))
                              }
                            />
                            <Label htmlFor="facade-open-desktop">
                              {t("projectEditor.facadeOpen")}
                            </Label>
                          </div>
                          <p className="text-xs text-gray-500">
                            {t("projectEditor.facadeOpenDesc")}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="latitude">
                            {t("projectEditor.latitude")}
                          </Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="0.000001"
                            value={project.latitude ?? ""}
                            onPaste={handlePaste}
                            onChange={(e) =>
                              setProject((prev) => ({
                                ...prev,
                                latitude: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              }))
                            }
                            placeholder={t("projectEditor.latitudePlaceholder")}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {t("projectEditor.latitudeExample")}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="longitude">
                            {t("projectEditor.longitude")}
                          </Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="0.000001"
                            value={project.longitude ?? ""}
                            onPaste={handlePaste}
                            onChange={(e) =>
                              setProject((prev) => ({
                                ...prev,
                                longitude: e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              }))
                            }
                            placeholder={t(
                              "projectEditor.longitudePlaceholder",
                            )}
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            {t("projectEditor.longitudeExample")}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="currency">
                            {t("projectEditor.currency")}
                          </Label>
                          <Select
                            value={project.currency}
                            onValueChange={(value: CurrencyType) =>
                              setProject((prev) => ({
                                ...prev,
                                currency: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("projectEditor.currency")}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CURRENCIES).map(
                                ([code, info]) => (
                                  <SelectItem key={code} value={code}>
                                    {t(info.translationKey)}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                          <p className="mt-1 text-xs text-gray-500">
                            {t("projectEditor.currencyDesc")}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="theme-color">
                            {t("projectEditor.themeColor")}
                          </Label>
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <Input
                                id="theme-color"
                                type="color"
                                value={project.theme_color}
                                onChange={(e) =>
                                  setProject((prev) => ({
                                    ...prev,
                                    theme_color: e.target.value,
                                  }))
                                }
                                className="h-10 w-20 cursor-pointer rounded border p-1"
                              />
                              <Input
                                type="text"
                                value={project.theme_color}
                                onChange={(e) =>
                                  setProject((prev) => ({
                                    ...prev,
                                    theme_color: e.target.value,
                                  }))
                                }
                                placeholder="#000000"
                                className="flex-1"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {[
                                "#000000",
                                "#3b82f6",
                                "#ef4444",
                                "#10b981",
                                "#f59e0b",
                                "#8b5cf6",
                                "#ec4899",
                                "#14b8a6",
                              ].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  className="h-8 w-8 rounded-full border-2 border-gray-300 transition-colors hover:border-gray-400"
                                  style={{ backgroundColor: color }}
                                  onClick={() =>
                                    setProject((prev) => ({
                                      ...prev,
                                      theme_color: color,
                                    }))
                                  }
                                  title={color}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {t("projectEditor.themeColorDesc")}
                          </p>
                        </div>

                        {/* PDF Presentation Upload */}
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="flex items-center gap-2 text-sm font-medium">
                            <FileText className="h-4 w-4" />
                            {t("projectEditor.pdfPresentation")}
                          </h4>

                          {project.pdf_presentation_url ? (
                            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-red-600" />
                                <span className="text-sm">
                                  {t("projectEditor.pdfUploaded")}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      project.pdf_presentation_url!,
                                      "_blank",
                                    )
                                  }
                                >
                                  {t("projectEditor.view")}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={handleRemovePdf}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
                              <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                              <p className="mb-4 text-sm text-muted-foreground">
                                {t("projectEditor.pdfPresentationDesc")}
                              </p>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePdfUpload(file);
                                }}
                                className="hidden"
                                id="pdf-upload-desktop"
                                disabled={isNew || uploadingPdf}
                              />
                              <label htmlFor="pdf-upload-desktop">
                                <Button
                                  variant="outline"
                                  disabled={isNew || uploadingPdf}
                                  asChild
                                >
                                  <span>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {uploadingPdf
                                      ? t("projectEditor.uploading")
                                      : t("projectEditor.uploadPdf")}
                                  </span>
                                </Button>
                              </label>
                              {isNew && (
                                <p className="mt-2 text-xs text-muted-foreground">
                                  {t("projectEditor.saveProjectFirstNote")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Настройки рассрочки */}
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="text-sm font-medium">
                            {t("projectEditor.installmentSettings")}
                          </h4>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="installment-enabled"
                              checked={project.installment_enabled}
                              onCheckedChange={(checked) =>
                                setProject((prev) => ({
                                  ...prev,
                                  installment_enabled: checked,
                                }))
                              }
                            />
                            <Label htmlFor="installment-enabled">
                              {t("projectEditor.enableInstallment")}
                            </Label>
                          </div>

                          {project.installment_enabled && (
                            <>
                              <div>
                                <Label htmlFor="min-down-payment">
                                  {t("projectEditor.minDownPaymentPercent")}
                                </Label>
                                <Input
                                  id="min-down-payment"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={project.min_down_payment_percent}
                                  onChange={(e) =>
                                    setProject((prev) => ({
                                      ...prev,
                                      min_down_payment_percent: Math.min(
                                        100,
                                        Math.max(
                                          0,
                                          parseInt(e.target.value) || 0,
                                        ),
                                      ),
                                    }))
                                  }
                                  placeholder="20"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  {t("projectEditor.minDownPaymentDesc")}
                                </p>
                              </div>

                              <div>
                                <Label htmlFor="max-installment-months">
                                  {t("projectEditor.maxInstallmentMonths")}
                                </Label>
                                <Input
                                  id="max-installment-months"
                                  type="number"
                                  min="1"
                                  max="120"
                                  value={project.max_installment_months}
                                  onChange={(e) =>
                                    setProject((prev) => ({
                                      ...prev,
                                      max_installment_months: Math.min(
                                        120,
                                        Math.max(
                                          1,
                                          parseInt(e.target.value) || 1,
                                        ),
                                      ),
                                    }))
                                  }
                                  placeholder="24"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                  {t("projectEditor.maxInstallmentMonthsDesc")}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        {isNew && (
                          <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full"
                            style={{
                              backgroundColor: ADMIN_THEME.primary,
                              color: ADMIN_THEME.textOnPrimary,
                            }}
                            onMouseEnter={(e) => {
                              if (!saving) {
                                e.currentTarget.style.backgroundColor =
                                  ADMIN_THEME.primaryHover;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!saving) {
                                e.currentTarget.style.backgroundColor =
                                  ADMIN_THEME.primary;
                              }
                            }}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {saving
                              ? t("projectEditor.saving")
                              : t("projectEditor.save&continue")}
                          </Button>
                        )}
                      </CardContent>
                    </Card>

                    {!isNew && <ProjectPriceManager projectId={project.id} />}
                  </>
                )}

                {activeTab === "building" && (
                  <BuildingImageEditor
                    projectId={project.id}
                    currentImageUrl={project.building_image_url}
                    onImageUpdate={(imageUrl) =>
                      setProject((prev) => ({
                        ...prev,
                        building_image_url: imageUrl,
                      }))
                    }
                  />
                )}
              </div>
            )}

            {activeTab === "floors" && project.project_type !== "object" && (
              <ProjectFloorsManager projectId={project.id} />
            )}

            {activeTab === "apartments" && (
              <div className="space-y-4">
                <ProjectApartmentsManager
                  projectId={project.id}
                  projectType={project.project_type ?? "building"}
                />
              </div>
            )}

            {activeTab === "fields" && (
              <AllFieldsManager projectId={project.id} />
            )}

            {activeTab === "photos" && (
              <ApartmentPhotosManager projectId={project.id} />
            )}

            {activeTab === "domains" && (
              <ProjectDomainSettings
                projectId={project.id}
                projectName={project.name}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectEditor;
