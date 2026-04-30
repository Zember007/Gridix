import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  FileDropzone,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
  UploadProgressCard,
} from "@gridix/ui";
import { ArrowLeft, Building2, FileText, Image, Save, X } from "lucide-react";
import {
  ADMIN_THEME,
  CURRENCIES,
  CurrencyType,
  DEFAULT_CURRENCY,
  getAdminThemeVariables,
  isValidCurrency,
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
  syncProjectBuildingImage,
  uploadFacadeImageToStorage,
} from "@/features/visualization/buildingImageEditor/api/buildingImageEditorApi";
import {
  ProjectEditorDataProvider,
  useProjectEditorDataContext,
} from "@/features/projectEditor/context/ProjectEditorDataContext";
import ProjectApartmentsManager from "@/components/projects/ProjectApartmentsManager";
import BuildingImageEditor from "@/components/visualization/BuildingImageEditor";
import AllFieldsManager from "@/features/projectEditor/ui/AllFieldsManager";
import ApartmentPhotosManager from "@/features/apartment-photos-management/ui/ApartmentPhotosManager";

import ProjectDomainSettings from "@/features/admin-project-domain-settings";
import { lazy, Suspense } from "react";
import { ProjectEditorSidebar } from "@/shared/ui/sidebar-component";
const GenplanEditorTab = lazy(
  () => import("@/features/genplan/ui/GenplanEditorTab"),
);
import { useLocation, useSearchParams } from "react-router-dom";
import ProjectFloorsManager from "@/components/projects/ProjectFloorsManager";
import { ProjectPriceManager } from "@/components/projects/ProjectPriceManager";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import { useDefaultSubProjectBuildingScope } from "@/features/projectEditor/hooks/useDefaultSubProjectBuildingScope";
import {
  trackOnboardingMilestone,
  tryAutoOpenProjectChecklistPanel,
} from "@gridix/utils/integrations";
import { startProjectEditorDriverTour } from "@/features/onboarding/driver";
import { resetProjectEditorInteractiveOnboardingStorage } from "@/features/onboarding/resetInteractiveOnboardingStorage";
import { ProjectOnboardingChecklistPanel } from "@/features/onboarding/checklist";
import {
  ALL_CURRENCIES,
  DEFAULT_PROJECT_EDITOR_PROJECT,
  type ProjectEditorProject,
} from "@/features/projectEditor/model/types";
import type { AdminBootstrapProject } from "@/entities/admin-access";
import { refreshAdminBootstrapCache } from "@/entities/admin-access/lib/refreshAdminBootstrapCache";
import { AdminAccessNotice } from "@/shared/ui/AdminAccessNotice";
import type { MainProjectCreationKind } from "@/components/projects/mainProjectCreationKind";

interface ProjectEditorProps {
  projectId: string;
  isNew: boolean;
  onBack: () => void;
  bootstrapProject?: AdminBootstrapProject | null;
  isRestrictedProject?: boolean;
  /** Demo cabinet: hide save / destructive actions without subscription notice. */
  readOnly?: boolean;
}

type EditorProjectSource = {
  id?: string;
  name?: string | null;
  description?: string | null;
  address?: string | null;
  floors?: number | null;
  has_parking?: boolean | null;
  has_commercial?: boolean | null;
  building_image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  currency?: CurrencyType | null;
  installment_enabled?: boolean | null;
  min_down_payment_percent?: number | null;
  max_installment_months?: number | null;
  pdf_presentation_url?: string | null;
  theme_color?: string | null;
  project_type?: "building" | "object" | null;
  available_languages?: unknown;
  available_currencies?: unknown;
  has_masterplan?: boolean | null;
  user_id?: string | null;
};

const parseAvailableLanguages = (value: unknown): Language[] => {
  if (!Array.isArray(value)) return SUPPORTED_LANGUAGES;
  const filtered = value.filter(
    (v): v is Language => typeof v === "string" && v in LANGUAGE_CONFIG,
  );
  return filtered.length > 0 ? filtered : SUPPORTED_LANGUAGES;
};

const parseAvailableCurrencies = (value: unknown): CurrencyType[] => {
  if (!Array.isArray(value)) return ALL_CURRENCIES;
  const filtered = value.filter(
    (v): v is CurrencyType => typeof v === "string" && isValidCurrency(v),
  );
  return filtered.length > 0 ? filtered : ALL_CURRENCIES;
};

interface ProjectPdfPresentationSectionProps {
  projectId: string;
  pdfPresentationUrl: string | null;
  isNew: boolean;
  hasUser: boolean;
  onPdfUrlChange: (pdfUrl: string | null) => void;
}

interface ProjectBuildingImageSectionProps {
  projectId: string;
  buildingImageUrl: string | null;
  isNew: boolean;
  hasUser: boolean;
  onUrlChange: (url: string | null) => void;
}

const ProjectBuildingImageSection = memo(
  ({
    projectId,
    buildingImageUrl,
    isNew,
    hasUser,
    onUrlChange,
  }: ProjectBuildingImageSectionProps) => {
    const { t } = useLanguage();
    const [uploading, setUploading] = useState(false);
    const [removing, setRemoving] = useState(false);

    const handleUpload = useCallback(
      async (file: File) => {
        if (!hasUser || isNew) {
          toast.error(t("projectEditor.saveProjectFirst"));
          return;
        }
        if (!file.type.startsWith("image/")) {
          toast.error(t("projectEditor.buildingImageOnlyImages"));
          return;
        }
        const maxSize = 15 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(t("projectEditor.buildingImageTooLarge"));
          return;
        }
        setUploading(true);
        try {
          const publicUrl = await uploadFacadeImageToStorage(projectId, file);
          await syncProjectBuildingImage(projectId, publicUrl);
          onUrlChange(publicUrl);
          toast.success(t("projectEditor.buildingImageUploadSuccess"));
        } catch (e) {
          console.error("Building image upload failed:", e);
          toast.error(t("projectEditor.buildingImageUploadError"));
        } finally {
          setUploading(false);
        }
      },
      [hasUser, isNew, onUrlChange, projectId, t],
    );

    const handleRemove = useCallback(async () => {
      if (!hasUser || isNew || !buildingImageUrl || removing || uploading) {
        return;
      }
      setRemoving(true);
      onUrlChange(null);
      try {
        await syncProjectBuildingImage(projectId, null);
        toast.success(t("projectEditor.buildingImageRemoveSuccess"));
      } catch (e) {
        onUrlChange(buildingImageUrl);
        console.error("Building image remove failed:", e);
        toast.error(t("projectEditor.buildingImageRemoveError"));
      } finally {
        setRemoving(false);
      }
    }, [
      buildingImageUrl,
      hasUser,
      isNew,
      onUrlChange,
      projectId,
      removing,
      t,
      uploading,
    ]);

    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <Image className="h-4 w-4" />
          {t("projectEditor.buildingImage")}
        </h4>
        <p className="text-xs text-muted-foreground">
          {t("projectEditor.buildingImageDesc")}
        </p>

        {buildingImageUrl ? (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <img
                src={buildingImageUrl}
                alt=""
                className="h-16 w-24 rounded-md border object-cover"
              />
              <span className="text-sm text-muted-foreground">
                {t("projectEditor.buildingImageUploaded")}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={uploading || removing}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = () => {
                    const f = input.files?.[0];
                    if (f) void handleUpload(f);
                  };
                  input.click();
                }}
              >
                {t("projectEditor.buildingImageReplace")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                disabled={removing || uploading}
                onClick={() => void handleRemove()}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 text-center">
            {!uploading && (
              <FileDropzone
                accept="image/*"
                disabled={isNew}
                multiple={false}
                heading={t("projectEditor.buildingImageUploadHeading")}
                description={t("projectEditor.buildingImageUploadHint")}
                dropLabel={t("projectEditor.clickOrDrop")}
                idleLabel={t("projectEditor.clickOrDrop")}
                className="p-0"
                onFilesSelected={async (files) => {
                  const file = files[0];
                  if (!file) return;
                  await handleUpload(file);
                }}
              />
            )}
            {uploading && (
              <p className="p-6 text-sm text-muted-foreground">
                {t("projectEditor.uploading")}
              </p>
            )}
            {isNew && (
              <p className="mt-2 px-3 pb-3 text-xs text-muted-foreground">
                {t("projectEditor.saveProjectFirstNote")}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

const ProjectPdfPresentationSection = memo(
  ({
    projectId,
    pdfPresentationUrl,
    isNew,
    hasUser,
    onPdfUrlChange,
  }: ProjectPdfPresentationSectionProps) => {
    const { t } = useLanguage();
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [removingPdf, setRemovingPdf] = useState(false);
    const [pdfUploadProgress, setPdfUploadProgress] = useState<{
      fileName: string;
      fileSize: number;
      progress: number;
      status: "uploading" | "complete";
    } | null>(null);

    const pdfUploadAbortControllerRef = useRef<AbortController | null>(null);
    const uploadRequestIdRef = useRef(0);
    const removeRequestIdRef = useRef(0);
    const latestPdfUrlRef = useRef(pdfPresentationUrl);

    useEffect(() => {
      latestPdfUrlRef.current = pdfPresentationUrl;
    }, [pdfPresentationUrl]);

    useEffect(() => {
      return () => {
        pdfUploadAbortControllerRef.current?.abort();
      };
    }, []);

    const handleCancelPdfUpload = useCallback(() => {
      pdfUploadAbortControllerRef.current?.abort();
    }, []);

    const handlePdfUpload = useCallback(
      async (file: File) => {
        if (!hasUser || isNew) {
          toast.error(t("projectEditor.saveProjectFirst"));
          return;
        }

        if (removingPdf) {
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

        const requestId = uploadRequestIdRef.current + 1;
        uploadRequestIdRef.current = requestId;

        const abortController = new AbortController();
        pdfUploadAbortControllerRef.current = abortController;

        setUploadingPdf(true);
        setPdfUploadProgress({
          fileName: file.name,
          fileSize: file.size,
          progress: 0,
          status: "uploading",
        });

        try {
          const { PDFDocument } = await import("pdf-lib");
          const arrayBuffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(arrayBuffer, {
            ignoreEncryption: true,
          });

          if (pdfDoc.getPageCount() === 0) {
            toast.error(t("projectEditor.invalidPdf"));
            return;
          }

          const { publicUrl } = await uploadProjectPdf(projectId, file, {
            signal: abortController.signal,
            onProgress: (progress) => {
              if (uploadRequestIdRef.current !== requestId) return;

              setPdfUploadProgress((prev) =>
                prev
                  ? {
                      ...prev,
                      progress,
                      status: "uploading",
                    }
                  : null,
              );
            },
          });

          if (
            uploadRequestIdRef.current !== requestId ||
            abortController.signal.aborted
          ) {
            return;
          }

          setPdfUploadProgress((prev) =>
            prev
              ? {
                  ...prev,
                  progress: 100,
                  status: "complete",
                }
              : null,
          );

          await new Promise((resolve) => setTimeout(resolve, 450));

          if (
            uploadRequestIdRef.current !== requestId ||
            abortController.signal.aborted
          ) {
            return;
          }

          onPdfUrlChange(publicUrl);
          toast.success(t("projectEditor.pdfUploadSuccess"));
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") {
            return;
          }

          console.error("Error uploading PDF:", error);
          toast.error(t("projectEditor.pdfUploadError"));
        } finally {
          if (uploadRequestIdRef.current === requestId) {
            if (pdfUploadAbortControllerRef.current === abortController) {
              pdfUploadAbortControllerRef.current = null;
            }

            setPdfUploadProgress(null);
            setUploadingPdf(false);
          }
        }
      },
      [hasUser, isNew, onPdfUrlChange, projectId, removingPdf, t],
    );

    const handleRemovePdf = useCallback(async () => {
      if (!hasUser || !pdfPresentationUrl || removingPdf || uploadingPdf) {
        return;
      }

      const requestId = removeRequestIdRef.current + 1;
      removeRequestIdRef.current = requestId;

      const currentPdfUrl = pdfPresentationUrl;

      setRemovingPdf(true);
      onPdfUrlChange(null);

      try {
        await removeProjectPdf(projectId, currentPdfUrl);

        if (removeRequestIdRef.current !== requestId) {
          return;
        }

        toast.success(t("projectEditor.pdfRemoveSuccess"));
      } catch (error) {
        if (removeRequestIdRef.current !== requestId) {
          return;
        }

        if (latestPdfUrlRef.current === null) {
          onPdfUrlChange(currentPdfUrl);
        }
        console.error("Error removing PDF:", error);
        toast.error(t("projectEditor.pdfRemoveError"));
      } finally {
        if (removeRequestIdRef.current === requestId) {
          setRemovingPdf(false);
        }
      }
    }, [
      hasUser,
      onPdfUrlChange,
      pdfPresentationUrl,
      projectId,
      removingPdf,
      t,
      uploadingPdf,
    ]);

    return (
      <div className="space-y-4 border-t pt-4">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <FileText className="h-4 w-4" />
          {t("projectEditor.pdfPresentation")}
        </h4>

        {pdfPresentationUrl ? (
          <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-600" />
              <span className="text-sm">{t("projectEditor.pdfUploaded")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => window.open(pdfPresentationUrl, "_blank")}
              >
                {t("projectEditor.view")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={handleRemovePdf}
                disabled={removingPdf || uploadingPdf}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border-2 border-dashed border-muted-foreground/25 text-center">
            {pdfUploadProgress ? (
              <div className="mx-auto max-w-md p-6 text-left">
                <UploadProgressCard
                  fileName={pdfUploadProgress.fileName}
                  fileSize={pdfUploadProgress.fileSize}
                  progress={pdfUploadProgress.progress}
                  status={pdfUploadProgress.status}
                  icon={<FileText className="h-8 w-8 text-red-600" />}
                  onCancel={handleCancelPdfUpload}
                />
              </div>
            ) : null}

            {!uploadingPdf && (
              <FileDropzone
                accept=".pdf,application/pdf"
                disabled={isNew || removingPdf}
                multiple={false}
                heading={t("projectEditor.uploadPdf")}
                description={t("projectEditor.pdfPresentationDesc")}
                dropLabel={t("projectEditor.clickOrDrop")}
                idleLabel={t("projectEditor.clickOrDrop")}
                className="p-0"
                onFilesSelected={async (files) => {
                  const file = files[0];
                  if (!file) return;
                  await handlePdfUpload(file);
                }}
              />
            )}

            {isNew && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("projectEditor.saveProjectFirstNote")}
              </p>
            )}
          </div>
        )}
      </div>
    );
  },
);

const ProjectEditor = ({
  projectId,
  isNew,
  onBack,
  bootstrapProject = null,
  isRestrictedProject = false,
  readOnly = false,
}: ProjectEditorProps) => {
  const [project, setProject] = useState<ProjectEditorProject>(
    DEFAULT_PROJECT_EDITOR_PROJECT,
  );
  const [saving, setSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [accessError, setAccessError] = useState<string | null>(null);

  const { navigate } = useLanguageNavigation();
  const queryClient = useQueryClient();
  const location = useLocation();
  const { user, userProfile, loading: authLoading, signOut } = useAuth();
  const { t } = useLanguage();
  const { isManager, developerIds } = useUserRole();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { project: cachedProject, loading: projectLoading } =
    useProjectInEditorScope(projectId);
  const editorDataContext = useProjectEditorDataContext();
  const [searchParams] = useSearchParams();
  const startedEditorTourRef = useRef(false);

  // Mobile menu state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const { scope: defaultBuildingScope, isReady: defaultBuildingScopeReady } =
    useDefaultSubProjectBuildingScope(!isNew && project.id ? project.id : null);
  /** Floors count for the building tab is stored on the default `sub_projects` row, not on `projects`. */
  const floorsSyncedFromSubProjectRef = useRef<string | null>(null);
  /** Building vs villas/townhouses — driven by form state; persisted on save to `projects` + default `sub_projects`. */
  const editorScopeKind: "building" | "object" =
    project.project_type === "object" ? "object" : "building";

  useEffect(() => {
    floorsSyncedFromSubProjectRef.current = null;
  }, [projectId]);

  useEffect(() => {
    if (
      isNew ||
      !project.id ||
      !defaultBuildingScopeReady ||
      !defaultBuildingScope
    ) {
      return;
    }
    if (floorsSyncedFromSubProjectRef.current === project.id) return;
    floorsSyncedFromSubProjectRef.current = project.id;
    setProject((prev) => ({
      ...prev,
      floors: defaultBuildingScope.floors,
    }));
  }, [isNew, project.id, defaultBuildingScopeReady, defaultBuildingScope]);

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Пресет типа проекта из модалки создания (корневой проект)
  useEffect(() => {
    if (!isNew) return;
    const kind = (
      location.state as { mainProjectKind?: MainProjectCreationKind } | null
    )?.mainProjectKind;
    if (!kind) return;
    setProject((prev) => {
      if (kind === "object") {
        return { ...prev, project_type: "object", has_masterplan: false };
      }
      if (kind === "genplan") {
        return { ...prev, project_type: "building", has_masterplan: true };
      }
      return { ...prev, project_type: "building", has_masterplan: false };
    });
  }, [isNew, location.state]);

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
        "genplan",
        "domains",
      ];
      if (validTabs.includes(page)) {
        setActiveTab(page);
      }
    }
  }, [searchParams]);

  const projectSource = isRestrictedProject
    ? bootstrapProject
    : (editorDataContext?.data?.project ?? cachedProject);

  const mapDbProjectToEditor = useCallback(
    (row: EditorProjectSource | null) => {
      if (!row) return;
      setProject({
        id: row.id || "",
        name: row.name || "",
        description: row.description || "",
        address: row.address || "",
        floors: row.floors || 1,
        has_parking: row.has_parking || false,
        has_commercial: row.has_commercial || false,
        building_image_url: row.building_image_url || null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        currency: (row.currency as CurrencyType) || DEFAULT_CURRENCY,
        installment_enabled: row.installment_enabled || false,
        min_down_payment_percent: row.min_down_payment_percent || 20,
        max_installment_months: row.max_installment_months || 24,
        pdf_presentation_url: row.pdf_presentation_url || null,
        theme_color:
          ((row as unknown as Record<string, unknown>).theme_color as string) ||
          "#000000",
        project_type:
          ((row as unknown as Record<string, unknown>).project_type as
            | "building"
            | "object"
            | null) || "building",
        available_languages: parseAvailableLanguages(row.available_languages),
        available_currencies: parseAvailableCurrencies(
          row.available_currencies,
        ),
        has_masterplan: Boolean(row.has_masterplan),
      });
    },
    [],
  );

  useEffect(() => {
    if (isNew || !projectId) return;
    const source = projectSource;
    if (!source) return;

    try {
      const canAccess =
        user &&
        (source.user_id === user.id ||
          (isManagerMode &&
            activeWorkspaceId &&
            source.user_id === activeWorkspaceId) ||
          (isManager && developerIds.includes(source.user_id ?? "")));

      if (!canAccess) {
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

  // Project editor onboarding: Driver.js + once в localStorage (`gridix_driver_once:…:project_editor`)
  // When genplan mode is active, hidden tabs should redirect to general
  const GENPLAN_HIDDEN_TABS = ["apartments", "floors", "photos", "fields"];
  useEffect(() => {
    if (project.has_masterplan && GENPLAN_HIDDEN_TABS.includes(activeTab)) {
      setActiveTab("basic");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.has_masterplan, activeTab]);

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
        await startProjectEditorDriverTour({
          userId: user.id,
          t,
        });
      } catch (e) {
        console.warn("Failed to start project editor onboarding tour:", e);
      }
    };

    void run();
  }, [authLoading, isNew, project?.id, t, user?.id]);

  // In-app project checklist: auto-open once per (user, project); skipped in driver dev mode
  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;
    if (isNew) return;
    if (!project?.id) return;
    try {
      tryAutoOpenProjectChecklistPanel(user.id, project.id);
    } catch (e) {
      console.warn("Failed to open project checklist panel:", e);
    }
  }, [authLoading, isNew, project?.id, user?.id]);

  const replayInteractiveProjectOnboarding = useCallback(async () => {
    if (!user?.id || !project?.id || isNew) return;
    resetProjectEditorInteractiveOnboardingStorage(user.id, project.id);
    startedEditorTourRef.current = false;
    startedEditorTourRef.current = true;
    try {
      await startProjectEditorDriverTour({
        userId: user.id,
        t,
      });
    } catch (e) {
      console.warn("Failed to start project editor onboarding tour:", e);
    }
    try {
      tryAutoOpenProjectChecklistPanel(user.id, project.id);
    } catch (e) {
      console.warn("Failed to open project checklist panel:", e);
    }
  }, [isNew, project?.id, t, user?.id]);

  // Reset per-project guard when switching projects (and allow re-run on navigation)
  useEffect(() => {
    startedEditorTourRef.current = false;
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

    void trackOnboardingMilestone({
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
        has_parking: project.has_parking,
        has_commercial: project.has_commercial,
        latitude: project.latitude,
        longitude: project.longitude,
        currency: project.currency,
        installment_enabled: project.installment_enabled,
        min_down_payment_percent: project.min_down_payment_percent,
        max_installment_months: project.max_installment_months,
        pdf_presentation_url: project.pdf_presentation_url,
        theme_color: project.theme_color,
        project_type: project.project_type || "building",
        available_languages: project.available_languages,
        available_currencies: project.available_currencies,
        has_masterplan: project.has_masterplan,
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

        await supabase.from("sub_projects").insert({
          project_id: data.id,
          name: data.name,
          slug: "default",
          type: data.project_type === "object" ? "object" : "building",
          sort_order: 0,
          is_default: true,
          floors: project.floors,
          has_parking: data.has_parking ?? false,
          has_commercial: data.has_commercial ?? false,
          address: data.address ?? null,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        });

        await refreshAdminBootstrapCache(queryClient);

        setProject((prev) => ({ ...prev, id: data.id }));
        toast.success(t("projectEditor.projectCreated"));
        void trackOnboardingMilestone({
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

        if (!project.has_masterplan) {
          await supabase
            .from("sub_projects")
            .update({
              name: project.name.trim(),
              type: project.project_type === "object" ? "object" : "building",
              floors: project.floors,
              has_parking: project.has_parking,
              has_commercial: project.has_commercial,
              address: project.address || null,
              latitude: project.latitude,
              longitude: project.longitude,
            })
            .eq("project_id", project.id)
            .eq("is_default", true);
        }

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
  const handlePdfUrlChange = useCallback((pdfUrl: string | null) => {
    setProject((prev) => ({ ...prev, pdf_presentation_url: pdfUrl }));
  }, []);

  const handleBuildingImageUrlChange = useCallback((url: string | null) => {
    setProject((prev) => ({ ...prev, building_image_url: url }));
  }, []);

  const [isCollapsed, setIsCollapsed] = useState(true);

  const isEditorDataLoading =
    !isNew &&
    !isRestrictedProject &&
    (editorDataContext?.loading ?? projectLoading);

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
      case "genplan":
        return "genplan";
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
      case "genplan":
        setActiveTab("genplan");
        break;
      case "domains":
        setActiveTab("domains");
        break;
      default:
        setActiveTab("basic");
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <ProjectEditorSidebar
        onSectionChange={handleSidebarSectionChange}
        activeTab={getSidebarSection(activeTab ?? "basic")}
        userEmail={userProfile?.email || user?.email || "Unknown user"}
        projectType={editorScopeKind}
        hasMasterplan={project.has_masterplan}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        isNavLoading={isEditorDataLoading}
      />
      <div
        className={`relative flex flex-1 flex-col bg-background transition-all duration-300 ${isCollapsed ? "md:ml-24 md:max-w-[calc(100vw-6rem)]" : "md:ml-64 md:max-w-[calc(100vw-16rem)]"}`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="sticky top-0 z-50 shrink-0 border-b bg-white">
            <div className="px-4 py-3 sm:px-6 sm:py-4 lg:px-6">
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
                  <div className="hidden min-w-0 lg:block">
                    <h1 className="truncate text-2xl font-bold">
                      {isNew ? t("projectEditor.newProject") : project.name}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {isNew
                        ? t("projectEditor.createNewProject")
                        : t("projectEditor.editProject")}
                    </p>
                  </div>
                  <div className="min-w-0 lg:hidden">
                    <h1 className="truncate text-lg font-bold">
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
                  {!readOnly && (
                    <Button
                      onClick={handleSave}
                      disabled={saving || isRestrictedProject}
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
                  )}
                </div>
              </div>
            </div>
          </div>

          {isEditorDataLoading ? (
            <div className="flex min-h-full items-center justify-center">
              <LoadingProgress />
            </div>
          ) : isRestrictedProject ? (
            <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 lg:px-6 lg:py-6">
              <div className="space-y-6">
                <AdminAccessNotice variant="subscription" />
                <Card>
                  <CardHeader>
                    <CardTitle>{t("projectEditor.basicInfo")}</CardTitle>
                    <CardDescription>
                      {t("projectEditor.editProject")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>{t("projectEditor.projectName")}</Label>
                      <Input value={project.name} readOnly />
                    </div>
                    <div>
                      <Label>{t("projectEditor.projectType")}</Label>
                      <Input
                        value={
                          editorScopeKind === "object"
                            ? t("projectEditor.typeObject")
                            : t("projectEditor.typeBuilding")
                        }
                        readOnly
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t("projectEditor.description")}</Label>
                      <Textarea
                        value={project.description ?? ""}
                        readOnly
                        rows={4}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t("projectEditor.address")}</Label>
                      <Input value={project.address ?? ""} readOnly />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="project_editor_content_usertour flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 lg:px-6 lg:py-6">
              {/* Show content based on activeTab without Tabs wrapper */}

              {(activeTab === "basic" || activeTab === "building") && (
                <div className="space-y-6">
                  {/* Sub-navigation for basic/building sections - only on desktop. Hide building tab when genplan is active (facade belongs to subprojects) */}
                  <div className="mb-6 hidden gap-2 lg:flex">
                    <Button
                      variant={activeTab === "basic" ? "default" : "outline"}
                      onClick={() => setActiveTab("basic")}
                      className="flex items-center gap-2"
                    >
                      <Building2 className="h-4 w-4" />
                      {t("projectEditor.basicInfo")}
                    </Button>
                    {!project.has_masterplan && (
                      <Button
                        variant={
                          activeTab === "building" ? "default" : "outline"
                        }
                        onClick={() => setActiveTab("building")}
                        disabled={isNew}
                        className="flex items-center gap-2"
                      >
                        <Image className="h-4 w-4" />
                        {editorScopeKind === "object"
                          ? "Object Image"
                          : t("projectEditor.buildingImage")}
                      </Button>
                    )}
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
                            <Label>
                              {t("projectEditor.availableLanguages")}
                            </Label>
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
                                          project.available_languages.length <=
                                            1
                                        ) {
                                          toast.error(
                                            t(
                                              "projectEditor.atLeastOneLanguage",
                                            ),
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
                          <div className="space-y-2">
                            <Label>
                              {t("projectEditor.availableCurrencies")}
                            </Label>
                            <p className="text-xs text-gray-500">
                              {t("projectEditor.availableCurrenciesDesc")}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              {ALL_CURRENCIES.map((code) => {
                                const checked =
                                  project.available_currencies.includes(code);
                                const id = `available-currency-${code}`;
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
                                          project.available_currencies.length <=
                                            1
                                        ) {
                                          toast.error(
                                            t(
                                              "projectEditor.atLeastOneCurrency",
                                            ),
                                          );
                                          return;
                                        }

                                        setProject((prev) => {
                                          const current =
                                            prev.available_currencies;
                                          if (shouldEnable) {
                                            if (current.includes(code))
                                              return prev;
                                            return {
                                              ...prev,
                                              available_currencies: [
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
                                            available_currencies:
                                              current.filter((c) => c !== code),
                                          };
                                        });
                                      }}
                                    />
                                    <Label
                                      htmlFor={id}
                                      className="cursor-pointer select-none"
                                    >
                                      <span className="mr-1 font-mono">
                                        {CURRENCIES[code].symbol}
                                      </span>
                                      {t(CURRENCIES[code].translationKey)}
                                    </Label>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          {!project.has_masterplan && (
                            <>
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                  <Label htmlFor="project-type">
                                    {t("projectEditor.projectType")}
                                  </Label>
                                  <Select
                                    value={editorScopeKind}
                                    onValueChange={(v) =>
                                      setProject((prev) => ({
                                        ...prev,
                                        project_type:
                                          v === "object"
                                            ? "object"
                                            : "building",
                                      }))
                                    }
                                  >
                                    <SelectTrigger id="project-type">
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
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {t("projectEditor.subProjectTypeHint")}
                                  </p>
                                </div>
                                {editorScopeKind !== "object" && (
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
                              </div>
                            </>
                          )}
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
                              placeholder={t(
                                "projectEditor.latitudePlaceholder",
                              )}
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

                          <ProjectBuildingImageSection
                            projectId={project.id}
                            buildingImageUrl={project.building_image_url}
                            isNew={isNew}
                            hasUser={Boolean(user)}
                            onUrlChange={handleBuildingImageUrlChange}
                          />

                          <ProjectPdfPresentationSection
                            projectId={project.id}
                            pdfPresentationUrl={project.pdf_presentation_url}
                            isNew={isNew}
                            hasUser={Boolean(user)}
                            onPdfUrlChange={handlePdfUrlChange}
                          />

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
                                    {t(
                                      "projectEditor.maxInstallmentMonthsDesc",
                                    )}
                                  </p>
                                </div>
                              </>
                            )}
                          </div>

                          {isNew && !readOnly && (
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

                  {activeTab === "building" && !project.has_masterplan && (
                    <>
                      {!defaultBuildingScopeReady ? (
                        <div className="flex min-h-[200px] items-center justify-center">
                          <LoadingProgress />
                        </div>
                      ) : !defaultBuildingScope ? (
                        <p className="text-sm text-destructive">
                          {t(
                            "projectEditor.facadeEditorDefaultSubProjectMissing",
                          )}
                        </p>
                      ) : (
                        <BuildingImageEditor
                          projectId={project.id}
                          subProjectId={defaultBuildingScope.subProjectId}
                          initialFloors={defaultBuildingScope.floors}
                          subProjectType={editorScopeKind}
                          currentImageUrl={
                            defaultBuildingScope.buildingImageUrl ??
                            project.building_image_url
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "floors" &&
                editorScopeKind !== "object" &&
                !project.has_masterplan &&
                (!defaultBuildingScopeReady ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <LoadingProgress />
                  </div>
                ) : !defaultBuildingScope ? (
                  <p className="text-sm text-destructive">
                    {t("projectEditor.facadeEditorDefaultSubProjectMissing")}
                  </p>
                ) : (
                  <ProjectFloorsManager
                    projectId={project.id}
                    subProjectId={defaultBuildingScope.subProjectId}
                  />
                ))}

              {activeTab === "apartments" &&
                !project.has_masterplan &&
                (!defaultBuildingScopeReady ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <LoadingProgress />
                  </div>
                ) : !defaultBuildingScope ? (
                  <p className="text-sm text-destructive">
                    {t("projectEditor.facadeEditorDefaultSubProjectMissing")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <ProjectApartmentsManager
                      projectId={project.id}
                      projectType={editorScopeKind}
                      subProjectId={defaultBuildingScope.subProjectId}
                    />
                  </div>
                ))}

              {activeTab === "fields" &&
                !project.has_masterplan &&
                (!defaultBuildingScopeReady ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <LoadingProgress />
                  </div>
                ) : !defaultBuildingScope ? (
                  <p className="text-sm text-destructive">
                    {t("projectEditor.facadeEditorDefaultSubProjectMissing")}
                  </p>
                ) : (
                  <AllFieldsManager
                    projectId={project.id}
                    subProjectId={defaultBuildingScope.subProjectId}
                  />
                ))}

              {activeTab === "photos" &&
                !project.has_masterplan &&
                (!defaultBuildingScopeReady ? (
                  <div className="flex min-h-[200px] items-center justify-center">
                    <LoadingProgress />
                  </div>
                ) : !defaultBuildingScope ? (
                  <p className="text-sm text-destructive">
                    {t("projectEditor.facadeEditorDefaultSubProjectMissing")}
                  </p>
                ) : (
                  <ApartmentPhotosManager
                    projectId={project.id}
                    subProjectId={defaultBuildingScope.subProjectId}
                  />
                ))}

              {activeTab === "genplan" &&
                (bootstrapProject?.plan_tier === "pro" &&
                bootstrapProject?.access_status === "active" ? (
                  <Suspense fallback={null}>
                    <GenplanEditorTab
                      projectId={!isNew ? project.id || projectId : project.id}
                      onMasterplanToggled={(active) =>
                        setProject((prev) => ({
                          ...prev,
                          has_masterplan: active,
                        }))
                      }
                    />
                  </Suspense>
                ) : (
                  <AdminAccessNotice variant="pro" />
                ))}

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
      {!isNew && project.id ? (
        <ProjectOnboardingChecklistPanel
          projectId={project.id}
          projectType={project.project_type ?? "building"}
          onNavigateEditorTab={setActiveTab}
          onReplayInteractiveOnboarding={replayInteractiveProjectOnboarding}
        />
      ) : null}
    </div>
  );
};

export default ProjectEditor;
