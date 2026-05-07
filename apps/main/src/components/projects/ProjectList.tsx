import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataState,
  FileDropzone,
  PageHeader,
  Skeleton,
  type SharedProject,
  SharedProjectDrawer,
  StatusBadge,
  UploadProgressCard,
} from "@gridix/ui";
import {
  AlertTriangle,
  Building,
  Building2,
  Crown,
  Download,
  FolderArchive,
  Edit3,
  Eye,
  FileText,
  Globe,
  Handshake,
  Image as ImageIcon,
  Info,
  Percent,
  PlayCircle,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { ADMIN_THEME, cn, getAdminThemeVariables } from "@gridix/utils/lib";
import {
  Project,
  useWorkspaceProjects,
} from "@/entities/workspace/queries/useWorkspaceProjects";
import { useProjectCRUD } from "@/entities/project/queries/useProjects";
import { useAdminAccess } from "@/entities/admin-access";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { resolveExternalVideoEmbedForZip } from "@/shared/lib/externalVideoZipHtml";
import { LeadsStats } from "@/entities/lead/ui/LeadsNotification";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import { supabase } from "@gridix/utils/api";
import Spinner from "@/shared/ui/Spinner.tsx";
import { DeveloperConstructionTab } from "./DeveloperConstructionTab";
import { JoinDemoButton } from "@/features/demo-cabinet";
import { adminThemeClasses } from "@/shared/lib/admin-theme-config";
import {
  type PendingVideoUpload,
  VideoUploadDialog,
} from "./VideoUploadDialog";
import { uploadProjectDrawerMediaItem } from "@/features/projectSelector/api/projectDrawerMediaApi";

const ProjectUnitsChessEditorTab = lazy(
  () => import("@/components/projects/ProjectUnitsChessEditorTab"),
);

const MEDIA_ACCEPT_BY_SECTION = {
  render: "image/*",
  video: "video/*",
  presentation:
    "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

interface ProjectListProps {
  onCreateNew?: () => void;
  onEditProject?: (projectId: string, isNew: boolean) => void;
  /**
   * CRM mode:
   * - hides create/edit/delete actions
   * - opens embed project in the current tab
   * - can append query params (e.g. crm=bitrix&deal_id=123) to opened URLs
   */
  mode?: "admin" | "crm";
  crmQueryParams?: Record<string, string | null | undefined>;
  /**
   * In admin we usually use `/${language}/embed/...`.
   * For CRM embed pages we need `/embed/...`.
   */
  embedPathMode?: "language" | "root";
}

const ProjectList = ({
  onCreateNew,
  onEditProject,
  mode = "admin",
  crmQueryParams,
  embedPathMode = "language",
}: ProjectListProps) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { projects, loading, refresh, isManagerMode } = useWorkspaceProjects();
  const { deleteProject: deleteProjectCRUD } = useProjectCRUD();
  const { amoWidget } = useAmoWidget();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [drawerProject, setDrawerProject] = useState<SharedProject | null>(
    null,
  );
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [projectPendingDeletion, setProjectPendingDeletion] =
    useState<Project | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(
    null,
  );

  const isCrmMode = mode === "crm";
  const adminAccess = useAdminAccess();

  // Применяем CSS переменные темы
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);

  // Удаляем старую функцию loadProjects, так как теперь используется хук

  const deleteProject = async (projectId: string, projectName: string) => {
    if (!user) {
      toast.error(t("projectList.authRequired"));
      return;
    }

    if (isManagerMode) {
      toast.error(t("projectList.managersCannotDelete"));
      return;
    }

    setDeletingProjectId(projectId);
    try {
      const success = await deleteProjectCRUD(projectId);
      if (success) {
        refresh(); // Обновляем список проектов
      }
    } finally {
      setDeletingProjectId(null);
    }
  };

  const getEmbedProjectUrl = (project: Project) => {
    const prefix = embedPathMode === "root" ? "" : `/${language}`;
    return project.slug
      ? `${prefix}/embed/project/${project.slug}`
      : `${prefix}/embed/project/id/${project.id}`;
  };

  const getPublicProjectUrl = (project: Project) => {
    return project.slug
      ? `/${language}/project/${project.slug}`
      : `/${language}/project/id/${project.id}`;
  };

  const viewProject = (project: Project) => {
    // CRM opens embed in the same tab; admin opens public page in new tab
    const base = isCrmMode
      ? getEmbedProjectUrl(project)
      : getPublicProjectUrl(project);

    const url = new URL(base, window.location.origin);
    if (isCrmMode && crmQueryParams) {
      for (const [k, v] of Object.entries(crmQueryParams)) {
        if (v === null || v === undefined || v === "")
          url.searchParams.delete(k);
        else url.searchParams.set(k, v);
      }
    }
    window.open(url.toString(), isCrmMode ? "_self" : "_blank");
  };

  // Convert Project to SharedProject for the drawer
  const toSharedProject = (project: Project): SharedProject => ({
    id: project.id,
    name: project.name,
    imageUrl: project.building_image_url ?? undefined,
    location: project.address ?? undefined,
    description: project.description ?? undefined,
    floors: project.floors ?? undefined,
    partnershipStatus: "active",
  });

  const mapApiProjectToShared = (p: any): SharedProject => {
    const media = p?.media
      ? {
          ...p.media,
          videos: Array.isArray(p.media.videos)
            ? p.media.videos.map(
                (video: {
                  url: string;
                  title: string;
                  thumbnail?: string;
                  sizeBytes?: number;
                }) => ({
                  ...video,
                }),
              )
            : p.media.videos,
        }
      : undefined;

    const partnershipSettings = p?.partnershipSettings
      ? {
          isEnabled: Boolean(p.partnershipSettings.isEnabled),
          allowPartnerConnect: p.partnershipSettings.allowPartnerConnect,
          commissionType: (p.partnershipSettings.commissionType === "fixed"
            ? "fixed"
            : "percent") as "fixed" | "percent",
          commissionValue: Number(p.partnershipSettings.commissionValue ?? 5),
          payoutCondition: p.partnershipSettings.payoutCondition ?? undefined,
          contractUrl: p.partnershipSettings.contractUrl ?? undefined,
        }
      : undefined;

    const commissionPercent =
      partnershipSettings?.commissionType === "percent"
        ? partnershipSettings.commissionValue
        : undefined;

    return {
      id: String(p?.id ?? ""),
      name: String(p?.name ?? ""),
      imageUrl: p?.imageUrl ? String(p.imageUrl) : undefined,
      location: p?.location ? String(p.location) : undefined,
      description: p?.description ? String(p.description) : undefined,
      completionDate: p?.completionDate ? String(p.completionDate) : undefined,
      floors:
        typeof p?.floors === "number"
          ? p.floors
          : p?.floors
            ? Number(p.floors)
            : undefined,
      minPrice: p?.minPrice ? Number(p.minPrice) : undefined,
      yield: p?.yield ? Number(p.yield) : undefined,
      stats: p?.stats ?? undefined,
      media,
      constructionProgress: p?.constructionProgress ?? undefined,
      partnershipSettings,
      partnershipStatus: "active",
      commissionPercent,
      commissionCondition: partnershipSettings?.payoutCondition,
    };
  };

  const loadDrawerProject = async (
    projectId: string,
    options?: { silent?: boolean },
  ) => {
    if (!options?.silent) {
      setDrawerLoading(true);
    }
    try {
      const { data, error } = await supabase.functions.invoke(
        "project-drawer",
        {
          body: { action: "get_project_drawer", project_id: projectId },
        },
      );
      if (error) throw error;
      if (!data?.success)
        throw new Error(data?.error ?? "Failed to load project");
      setDrawerProject(mapApiProjectToShared(data.project));
    } catch (e) {
      console.error("Failed to load drawer project", e);
      toast.error("Не удалось загрузить данные проекта для сайдбара");
      if (!options?.silent) {
        setDrawerProject(null);
      }
    } finally {
      if (!options?.silent) {
        setDrawerLoading(false);
      }
    }
  };

  const handleOpenDrawer = (project: Project) => {
    setSelectedProject(project);
  };

  const handleCloseDrawer = () => {
    setSelectedProject(null);
    setDrawerProject(null);
  };

  const handleOpenPublicPage = (p: SharedProject) => {
    const project = projects.find((pr) => pr.id === p.id);
    if (!project) return;
    viewProject(project);
  };

  const handleNavigateToEditor = (projectId: string) => {
    setSelectedProject(null);
    setDrawerProject(null);
    onEditProject?.(projectId, false);
  };

  useEffect(() => {
    if (!selectedProject || isCrmMode) return;
    void loadDrawerProject(selectedProject.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject?.id, isCrmMode]);

  const effectiveDrawerProject = useMemo(() => {
    if (drawerProject) return drawerProject;
    if (selectedProject) return toSharedProject(selectedProject);
    return null;
  }, [drawerProject, selectedProject]);

  const DeveloperPartnersTab = ({ project }: { project: SharedProject }) => {
    const initial = useMemo(
      () =>
        project.partnershipSettings ?? {
          isEnabled: false,
          allowPartnerConnect: true,
          commissionType: "percent" as const,
          commissionValue: 5,
          payoutCondition: "",
          contractUrl: "",
        },
      [project.partnershipSettings],
    );

    const [form, setForm] = useState(initial);
    useEffect(() => setForm(initial), [initial, project.id]); // reset on project change / reload

    const onSave = async () => {
      try {
        const { error } = await supabase.functions.invoke("project-drawer", {
          body: {
            action: "upsert_partnership_settings",
            project_id: project.id,
            settings: {
              is_enabled: Boolean(form.isEnabled),
              allow_partner_connect: Boolean(form.allowPartnerConnect ?? true),
              commission_type: form.commissionType,
              commission_value: Number(form.commissionValue ?? 0),
              payout_condition: form.payoutCondition ?? null,
              contract_url: form.contractUrl ?? null,
            },
          },
        });
        if (error) throw error;
        toast.success("Условия партнёрской программы обновлены");
        await loadDrawerProject(project.id);
      } catch (e) {
        console.error("Failed to save partnership settings", e);
        toast.error("Не удалось сохранить условия");
      }
    };

    return (
      <div className="h-full space-y-6 p-6">
        <div className="flex gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="h-fit shrink-0 rounded-lg bg-indigo-100 p-2 text-indigo-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-indigo-900">
              {t("projectList.productConditions.title")}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-indigo-700">
              {t("projectList.productConditions.description", {
                name: project.name,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Globe size={16} className="text-blue-600" />{" "}
              {t("projectList.productConditions.publishInCatalog")}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {t("projectList.productConditions.publishInCatalogDesc")}
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={Boolean(form.isEnabled)}
              onChange={(e) =>
                setForm((p) => ({ ...p, isEnabled: e.target.checked }))
              }
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          </label>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Handshake size={16} className="text-slate-700" />{" "}
              {t("projectList.productConditions.allowBecomePartner")}
            </h4>
            <p className="mt-1 text-xs text-slate-500">
              {t("projectList.productConditions.allowBecomePartnerDesc")}
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={form.allowPartnerConnect !== false}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  allowPartnerConnect: e.target.checked,
                }))
              }
            />
            <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none" />
          </label>
        </div>

        <div className="space-y-4">
          <h4 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-900">
            {t("projectList.productConditions.rewardConditions")}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500">
                {t("projectList.productConditions.commissionTypeLabel")}
              </label>
              <div className="flex rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, commissionType: "percent" }))
                  }
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    form.commissionType === "percent"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {t("projectList.productConditions.commissionPercent")}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, commissionType: "fixed" }))
                  }
                  className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-all ${
                    form.commissionType === "fixed"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500"
                  }`}
                >
                  {t("projectList.productConditions.commissionFixed")}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-500">
                {t("projectList.productConditions.commissionSize")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={Number(form.commissionValue ?? 0)}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      commissionValue: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {form.commissionType === "percent" ? (
                    <Percent size={14} />
                  ) : (
                    "$"
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-500">
              {t("projectList.productConditions.payoutConditionsLabel")}
            </label>
            <textarea
              value={String(form.payoutCondition ?? "")}
              onChange={(e) =>
                setForm((p) => ({ ...p, payoutCondition: e.target.value }))
              }
              placeholder={t(
                "projectList.productConditions.payoutConditionPlaceholder",
              )}
              className="min-h-[90px] w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Save size={16} /> {t("projectList.productConditions.apply")}
          </button>
        </div>
      </div>
    );
  };

  const DeveloperMediaTab = ({ project }: { project: SharedProject }) => {
    type MediaUploadKind = "render" | "presentation";
    type MediaSectionKind = "render" | "video" | "presentation";
    interface MediaUploadProgressItem {
      id: string;
      kind: MediaUploadKind;
      fileName: string;
      fileSize: number;
      progress: number;
      status: "uploading" | "complete";
    }

    const MAX_CONCURRENT_MEDIA_UPLOADS = 3;
    const [uploading, setUploading] = useState<
      null | "render" | "video" | "presentation"
    >(null);
    const [mediaUploadProgresses, setMediaUploadProgresses] = useState<
      MediaUploadProgressItem[]
    >([]);
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
    const [videoUploadDialogOpen, setVideoUploadDialogOpen] = useState(false);
    const [pendingVideoUploads, setPendingVideoUploads] = useState<
      PendingVideoUpload[]
    >([]);
    const [videoLinksInput, setVideoLinksInput] = useState("");
    const [videoLinksError, setVideoLinksError] = useState<string | null>(null);
    const [addingVideoLinks, setAddingVideoLinks] = useState(false);
    const [videoLinksExpanded, setVideoLinksExpanded] = useState(false);
    const [activeDropSection, setActiveDropSection] =
      useState<MediaSectionKind | null>(null);
    const [previewMedia, setPreviewMedia] = useState<{
      kind: "image" | "video";
      url: string;
      title: string;
    } | null>(null);
    const [zipping, setZipping] = useState(false);
    const mediaUploadAbortControllersRef = useRef(
      new Map<string, AbortController>(),
    );
    const canceledMediaUploadIdsRef = useRef(new Set<string>());
    const mediaUploadRequestIdRef = useRef(0);

    const safeFilename = (value: string, fallback: string) => {
      const cleaned = value
        .replace(/[<>:"/\\|?*]/g, "_")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      return cleaned || fallback;
    };

    const formatBytes = (value?: number) => {
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        return null;
      }

      const units = ["B", "KB", "MB", "GB", "TB"] as const;
      let size = value;
      let unitIndex = 0;

      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
      }

      const fractionDigits = size >= 100 || unitIndex === 0 ? 0 : 1;
      return `${size.toFixed(fractionDigits)} ${units[unitIndex]}`;
    };

    const extensionFromUrl = (url: string, fallback: string) => {
      const sanitizedFallback = fallback.startsWith(".")
        ? fallback
        : `.${fallback}`;
      try {
        const normalized = new URL(url, window.location.origin);
        const lastSegment = normalized.pathname.split("/").pop() ?? "";
        const lastDot = lastSegment.lastIndexOf(".");
        if (lastDot > 0) return lastSegment.slice(lastDot);
      } catch {
        return sanitizedFallback;
      }
      return sanitizedFallback;
    };

    const isExternalVideoUrl = (url: string) => {
      try {
        const parsed = new URL(url, window.location.origin);
        const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
        return (
          host.includes("youtube.com") ||
          host === "youtu.be" ||
          host.includes("vimeo.com") ||
          host.includes("dailymotion.com") ||
          host.includes("rutube.ru") ||
          host.includes("vkvideo.ru")
        );
      } catch {
        return false;
      }
    };

    const hasDraggedFiles = (dataTransfer: DataTransfer | null) =>
      Array.from(dataTransfer?.types ?? []).includes("Files");

    const matchesDraggedItemAccept = (
      item: DataTransferItem,
      acceptToken: string,
    ) => {
      const normalizedToken = acceptToken.trim().toLowerCase();
      if (!normalizedToken || item.kind !== "file") return false;

      const itemType = item.type.toLowerCase();
      if (!itemType) return false;

      if (normalizedToken.endsWith("/*")) {
        const mimePrefix = normalizedToken.slice(0, -1);
        return itemType.startsWith(mimePrefix);
      }

      if (normalizedToken.startsWith(".")) {
        return false;
      }

      return itemType === normalizedToken;
    };

    const canDropIntoSection = useCallback(
      (dataTransfer: DataTransfer | null, section: MediaSectionKind) => {
        const items = Array.from(dataTransfer?.items ?? []);
        if (items.length === 0) return false;

        const acceptTokens = MEDIA_ACCEPT_BY_SECTION[section]
          .split(",")
          .map((token) => token.trim())
          .filter(Boolean);

        return items.some((item) =>
          acceptTokens.some((acceptToken) =>
            matchesDraggedItemAccept(item, acceptToken),
          ),
        );
      },
      [],
    );

    const handleMediaSectionDragOver = useCallback(
      (section: MediaSectionKind) =>
        (event: React.DragEvent<HTMLDivElement>) => {
          if (
            !hasDraggedFiles(event.dataTransfer) ||
            !canDropIntoSection(event.dataTransfer, section)
          ) {
            return;
          }

          event.preventDefault();
          if (uploading !== null) {
            return;
          }

          setActiveDropSection((current) =>
            current === section ? current : section,
          );
        },
      [canDropIntoSection, uploading],
    );

    const handleMediaSectionDragLeave = useCallback(
      (section: MediaSectionKind) =>
        (event: React.DragEvent<HTMLDivElement>) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (nextTarget && event.currentTarget.contains(nextTarget)) {
            return;
          }

          setActiveDropSection((current) =>
            current === section ? null : current,
          );
        },
      [],
    );

    useEffect(() => {
      const resetActiveDropSection = () => setActiveDropSection(null);

      window.addEventListener("drop", resetActiveDropSection);
      window.addEventListener("dragend", resetActiveDropSection);

      return () => {
        window.removeEventListener("drop", resetActiveDropSection);
        window.removeEventListener("dragend", resetActiveDropSection);
      };
    }, []);

    const parseVideoLinks = (input: string): string[] | null => {
      const links = input
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      if (links.length === 0) return [];

      const normalized: string[] = [];
      for (const link of links) {
        try {
          const parsed = new URL(link);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return null;
          }
          normalized.push(parsed.toString());
        } catch {
          return null;
        }
      }
      return normalized;
    };

    const triggerDownload = (href: string, filename: string) => {
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    const downloadByUrl = async (url: string, filename: string) => {
      try {
        const normalized = new URL(url, window.location.origin);
        const response = await fetch(normalized.toString(), {
          mode: "cors",
          credentials: "omit",
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        triggerDownload(objectUrl, filename);

        // Give the browser time to start the download before cleanup.
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } catch {
        try {
          const normalized = new URL(url, window.location.origin);
          triggerDownload(normalized.toString(), filename);
        } catch {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    };

    const resetPendingVideoUploads = () => {
      setPendingVideoUploads((current) => {
        current.forEach((item) => {
          URL.revokeObjectURL(item.filePreviewUrl);
          if (item.thumbnailPreviewUrl) {
            URL.revokeObjectURL(item.thumbnailPreviewUrl);
          }
        });
        return [];
      });
    };

    useEffect(() => {
      const mediaUploadAbortControllers =
        mediaUploadAbortControllersRef.current;
      const canceledMediaUploadIds = canceledMediaUploadIdsRef.current;

      return () => {
        mediaUploadRequestIdRef.current += 1;
        mediaUploadAbortControllers.forEach((controller) => controller.abort());
        mediaUploadAbortControllers.clear();
        canceledMediaUploadIds.clear();
        pendingVideoUploads.forEach((item) => {
          URL.revokeObjectURL(item.filePreviewUrl);
          if (item.thumbnailPreviewUrl) {
            URL.revokeObjectURL(item.thumbnailPreviewUrl);
          }
        });
      };
    }, [pendingVideoUploads]);

    const updateMediaUploadItem = useCallback(
      (
        uploadId: string,
        updater: (
          item: MediaUploadProgressItem,
        ) => MediaUploadProgressItem | null,
      ) => {
        setMediaUploadProgresses((current) =>
          current.flatMap((item) => {
            if (item.id !== uploadId) return [item];
            const next = updater(item);
            return next ? [next] : [];
          }),
        );
      },
      [],
    );

    const removeMediaUploadItem = useCallback((uploadId: string) => {
      setMediaUploadProgresses((current) =>
        current.filter((item) => item.id !== uploadId),
      );
    }, []);

    const handleCancelMediaUpload = useCallback(
      (uploadId: string) => {
        canceledMediaUploadIdsRef.current.add(uploadId);
        const controller = mediaUploadAbortControllersRef.current.get(uploadId);
        if (controller) {
          controller.abort();
          mediaUploadAbortControllersRef.current.delete(uploadId);
        }
        removeMediaUploadItem(uploadId);
      },
      [removeMediaUploadItem],
    );

    const uploadFiles = async (
      kind: "render" | "video" | "presentation",
      filesInput: FileList | File[] | null,
    ) => {
      const files = filesInput ? Array.from(filesInput) : [];
      if (files.length === 0) return;
      if (!user) {
        toast.error(t("projectList.authRequired"));
        return;
      }

      if (kind === "video") {
        setUploading(kind);
      }

      if (kind === "render" || kind === "presentation") {
        const requestId = mediaUploadRequestIdRef.current + 1;
        mediaUploadRequestIdRef.current = requestId;
        canceledMediaUploadIdsRef.current.clear();

        const uploadItems = files.map((file, index) => ({
          id: `${requestId}-${kind}-${index}-${file.name}-${file.lastModified}`,
          file,
          title:
            kind === "presentation"
              ? file.name.replace(/\.[^/.]+$/, "")
              : undefined,
        }));

        setUploading(kind);
        setMediaUploadProgresses((current) => [
          ...current.filter((item) => item.kind !== kind),
          ...uploadItems.map((item) => ({
            id: item.id,
            kind,
            fileName: item.file.name,
            fileSize: item.file.size,
            progress: 0,
            status: "uploading" as const,
          })),
        ]);

        try {
          let nextTaskIndex = 0;
          let successfulUploads = 0;
          let failedUploads = 0;

          const worker = async () => {
            while (nextTaskIndex < uploadItems.length) {
              const task = uploadItems[nextTaskIndex];
              nextTaskIndex += 1;

              if (!task) return;
              if (canceledMediaUploadIdsRef.current.has(task.id)) {
                continue;
              }

              const abortController = new AbortController();
              mediaUploadAbortControllersRef.current.set(
                task.id,
                abortController,
              );

              try {
                await uploadProjectDrawerMediaItem(
                  {
                    projectId: project.id,
                    kind,
                    file: task.file,
                    title: task.title,
                  },
                  {
                    signal: abortController.signal,
                    onProgress: (progress) => {
                      if (
                        mediaUploadRequestIdRef.current !== requestId ||
                        canceledMediaUploadIdsRef.current.has(task.id)
                      ) {
                        return;
                      }

                      updateMediaUploadItem(task.id, (item) => ({
                        ...item,
                        progress,
                        status: "uploading",
                      }));
                    },
                  },
                );

                mediaUploadAbortControllersRef.current.delete(task.id);

                if (
                  mediaUploadRequestIdRef.current !== requestId ||
                  canceledMediaUploadIdsRef.current.has(task.id)
                ) {
                  removeMediaUploadItem(task.id);
                  continue;
                }

                successfulUploads += 1;
                updateMediaUploadItem(task.id, (item) => ({
                  ...item,
                  progress: 100,
                  status: "complete",
                }));
              } catch (e) {
                mediaUploadAbortControllersRef.current.delete(task.id);

                if (e instanceof Error && e.name === "AbortError") {
                  removeMediaUploadItem(task.id);
                  continue;
                }

                failedUploads += 1;
                removeMediaUploadItem(task.id);
                console.error("Failed to upload media", e);
              }
            }
          };

          await Promise.all(
            Array.from(
              {
                length: Math.min(
                  MAX_CONCURRENT_MEDIA_UPLOADS,
                  uploadItems.length,
                ),
              },
              () => worker(),
            ),
          );

          if (mediaUploadRequestIdRef.current !== requestId) {
            return;
          }

          if (successfulUploads > 0) {
            toast.success(t("projectList.media.uploadSuccess"));
            await loadDrawerProject(project.id, { silent: true });
            await new Promise((resolve) => setTimeout(resolve, 450));
          }

          if (failedUploads > 0 && successfulUploads === 0) {
            toast.error(t("projectList.media.uploadError"));
          }
        } finally {
          if (mediaUploadRequestIdRef.current === requestId) {
            mediaUploadAbortControllersRef.current.forEach((controller, id) => {
              if (id.includes(`-${kind}-`)) {
                controller.abort();
                mediaUploadAbortControllersRef.current.delete(id);
              }
            });
            setMediaUploadProgresses((current) =>
              current.filter(
                (item) => item.kind !== kind || item.status !== "complete",
              ),
            );
            setUploading(null);
          }
        }

        return;
      }

      setUploading(kind);
      try {
        for (const file of files) {
          const form = new FormData();
          form.set("action", "upload_media_item");
          form.set("project_id", project.id);
          form.set("kind", kind);
          form.set("file", file);

          const { data, error: invokeErr } = await supabase.functions.invoke(
            "project-drawer",
            { body: form },
          );
          if (invokeErr) throw invokeErr;
          if (data?.error) throw new Error(String(data.error));
        }
        toast.success(t("projectList.media.uploadSuccess"));
        await loadDrawerProject(project.id, { silent: true });
      } catch (e) {
        console.error("Failed to upload media", e);
        toast.error(t("projectList.media.uploadError"));
      } finally {
        setUploading(null);
      }
    };

    const handleVideoSelection = (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const selected = Array.from(files).map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        filePreviewUrl: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, ""),
        thumbnailFile: null,
        thumbnailPreviewUrl: null,
      }));

      setPendingVideoUploads(selected);
      setVideoUploadDialogOpen(true);
    };

    const handleVideoFilesSelected = async (files: File[]) => {
      if (files.length === 0) return;

      const dataTransfer = new DataTransfer();
      files.forEach((file) => dataTransfer.items.add(file));
      handleVideoSelection(dataTransfer.files);
    };

    const updatePendingVideoTitle = (id: string, title: string) => {
      setPendingVideoUploads((current) =>
        current.map((item) => (item.id === id ? { ...item, title } : item)),
      );
    };

    const updatePendingVideoThumbnail = (id: string, file: File | null) => {
      setPendingVideoUploads((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          if (item.thumbnailPreviewUrl) {
            URL.revokeObjectURL(item.thumbnailPreviewUrl);
          }
          return {
            ...item,
            thumbnailFile: file,
            thumbnailPreviewUrl: file ? URL.createObjectURL(file) : null,
          };
        }),
      );
    };

    const handleCloseVideoUploadDialog = (open: boolean) => {
      setVideoUploadDialogOpen(open);
      if (!open && uploading !== "video") {
        resetPendingVideoUploads();
      }
    };

    const uploadPendingVideos = async () => {
      if (pendingVideoUploads.length === 0) return;
      if (!user) {
        toast.error(t("projectList.authRequired"));
        return;
      }

      setUploading("video");
      try {
        for (const item of pendingVideoUploads) {
          const form = new FormData();
          form.set("action", "upload_media_item");
          form.set("project_id", project.id);
          form.set("kind", "video");
          form.set("file", item.file);
          form.set("title", item.title.trim() || item.file.name);
          if (item.thumbnailFile) {
            form.set("thumbnail", item.thumbnailFile);
          }

          const { data, error: invokeErr } = await supabase.functions.invoke(
            "project-drawer",
            { body: form },
          );
          if (invokeErr) throw invokeErr;
          if (data?.error) throw new Error(String(data.error));
        }

        toast.success(t("projectList.media.uploadSuccess"));
        setVideoUploadDialogOpen(false);
        resetPendingVideoUploads();
        await loadDrawerProject(project.id, { silent: true });
      } catch (e) {
        console.error("Failed to upload videos", e);
        toast.error(t("projectList.media.uploadError"));
      } finally {
        setUploading(null);
      }
    };

    const addVideoLinks = async () => {
      const links = parseVideoLinks(videoLinksInput);
      if (!links) {
        setVideoLinksError(t("projectList.media.invalidLink"));
        return;
      }
      if (links.length === 0) return;
      if (!user) {
        toast.error(t("projectList.authRequired"));
        return;
      }

      setVideoLinksError(null);
      setAddingVideoLinks(true);
      try {
        for (const link of links) {
          const form = new FormData();
          form.set("action", "upload_media_item");
          form.set("project_id", project.id);
          form.set("kind", "video");
          form.set("url", link);

          const { data, error: invokeErr } = await supabase.functions.invoke(
            "project-drawer",
            { body: form },
          );
          if (invokeErr) throw invokeErr;
          if (data?.error) throw new Error(String(data.error));
        }

        toast.success(t("projectList.media.uploadSuccess"));
        setVideoLinksInput("");
        setVideoLinksExpanded(false);
        await loadDrawerProject(project.id, { silent: true });
      } catch (e) {
        console.error("Failed to add video links", e);
        toast.error(t("projectList.media.uploadError"));
      } finally {
        setAddingVideoLinks(false);
      }
    };

    const handleDeleteMedia = async (url: string) => {
      if (!url || deletingUrl) return;

      const previousMedia = project.media;

      setDrawerProject((current) => {
        if (!current || current.id !== project.id) {
          return current;
        }

        return {
          ...current,
          media: {
            ...current.media,
            renders: (current.media?.renders ?? []).filter(
              (itemUrl) => itemUrl !== url,
            ),
            videos: (current.media?.videos ?? []).filter(
              (video) => video.url !== url,
            ),
            presentations: (current.media?.presentations ?? []).filter(
              (doc) => doc.url !== url,
            ),
          },
        };
      });

      setDeletingUrl(url);
      try {
        const { data, error } = await supabase.functions.invoke(
          "project-drawer",
          {
            body: {
              action: "delete_media_item",
              project_id: project.id,
              url,
            },
          },
        );
        if (error) throw error;
        if (data?.error) throw new Error(String(data.error));
        toast.success("Media deleted");
      } catch (e) {
        setDrawerProject((current) => {
          if (!current || current.id !== project.id) {
            return current;
          }

          return {
            ...current,
            media: previousMedia,
          };
        });
        console.error("Failed to delete media", e);
        toast.error("Failed to delete media");
      } finally {
        setDeletingUrl(null);
      }
    };

    const renders = project.media?.renders ?? [];
    const videos = project.media?.videos ?? [];
    const docs = project.media?.presentations ?? [];
    const renderUploadProgresses = mediaUploadProgresses.filter(
      (item) => item.kind === "render",
    );
    const presentationUploadProgresses = mediaUploadProgresses.filter(
      (item) => item.kind === "presentation",
    );
    const projectFilenamePrefix = safeFilename(project.name, "project");

    const downloadAllItemCount =
      renders.length + videos.length + docs.filter((d) => d.url).length;
    const canDownloadAll = downloadAllItemCount > 0;

    const handleDownloadAllMediaZip = useCallback(async () => {
      if (zipping) return;
      const r = project.media?.renders ?? [];
      const v = project.media?.videos ?? [];
      const p = project.media?.presentations ?? [];
      const items: Array<{ url: string; filename: string }> = [];
      r.forEach((url, i) => {
        items.push({
          url,
          filename: `${projectFilenamePrefix}-render-${i + 1}${extensionFromUrl(url, ".jpg")}`,
        });
      });
      let hostedVideoIndex = 0;
      v.forEach((vid) => {
        if (isExternalVideoUrl(vid.url)) return;
        hostedVideoIndex += 1;
        items.push({
          url: vid.url,
          filename: `${projectFilenamePrefix}-video-${hostedVideoIndex}-${safeFilename(vid.title, "video")}${extensionFromUrl(vid.url, ".mp4")}`,
        });
      });
      p.forEach((doc) => {
        if (doc.url) {
          items.push({
            url: doc.url,
            filename: `${projectFilenamePrefix}-${safeFilename(doc.title, "document")}${extensionFromUrl(doc.url, ".pdf")}`,
          });
        }
      });

      const escapeHtmlText = (s: string) =>
        s
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

      const escapeHtmlAttr = (s: string) =>
        escapeHtmlText(s).replace(/'/g, "&#39;");

      const externalVideoListItems: string[] = [];
      for (const vid of v) {
        if (!isExternalVideoUrl(vid.url)) continue;
        const title = String(vid.title ?? "").trim();
        const href = escapeHtmlAttr(vid.url);
        const linkLabel = escapeHtmlText(title || vid.url);
        const resolved = resolveExternalVideoEmbedForZip(vid.url);

        if (resolved) {
          const embedAttr = escapeHtmlAttr(resolved.embedSrc);
          const titleAttr = escapeHtmlAttr(title || "Video");
          const posterBlock = resolved.posterSrc
            ? `<a class="zip-ext-video__poster" href="${href}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtmlAttr(resolved.posterSrc)}" alt="" width="640" height="360" loading="lazy" decoding="async" /></a>`
            : "";
          externalVideoListItems.push(
            `<li class="zip-ext-video"><div class="zip-ext-video__title"><a href="${href}" target="_blank" rel="noopener noreferrer">${linkLabel}</a></div>${posterBlock}<div class="zip-ext-video__player"><iframe src="${embedAttr}" title="${titleAttr}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div></li>`,
          );
        } else {
          externalVideoListItems.push(
            `<li class="zip-ext-video zip-ext-video--fallback"><a href="${href}" target="_blank" rel="noopener noreferrer">${linkLabel}</a></li>`,
          );
        }
      }

      const externalVideoLinksHtml =
        externalVideoListItems.length > 0
          ? `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtmlText(`${projectFilenamePrefix} — external videos`)}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:42rem;margin:2rem auto;padding:0 1rem;line-height:1.5;color:#0f172a}
h1{font-size:1.125rem;font-weight:700;margin:0 0 1rem}
ul{list-style:none;padding:0;margin:0}
.zip-ext-video{margin-bottom:1.25rem;padding:0.75rem 1rem;background:#f8fafc;border-radius:0.5rem;border:1px solid #e2e8f0}
.zip-ext-video__title{font-weight:600;margin-bottom:0.5rem}
.zip-ext-video__title a,.zip-ext-video--fallback a{color:#2563eb;text-decoration:underline;word-break:break-word}
.zip-ext-video__title a:hover,.zip-ext-video--fallback a:hover{color:#1d4ed8}
.zip-ext-video__poster{display:block;margin:0 0 0.5rem;border-radius:0.375rem;overflow:hidden;border:1px solid #e2e8f0}
.zip-ext-video__poster img{width:100%;height:auto;vertical-align:middle;display:block;aspect-ratio:16/9;object-fit:cover;background:#0f172a}
.zip-ext-video__player{position:relative;width:100%;aspect-ratio:16/9;background:#0f172a;border-radius:0.375rem;overflow:hidden}
.zip-ext-video__player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.zip-ext-video--fallback{font-weight:600}
</style>
</head>
<body>
<h1>${escapeHtmlText(projectFilenamePrefix)} — external video links</h1>
<ul>
${externalVideoListItems.join("\n")}
</ul>
</body>
</html>`
          : "";

      if (items.length === 0 && !externalVideoLinksHtml) return;
      setZipping(true);
      try {
        const { zip } = await import("fflate");

        const files: Record<string, Uint8Array> = {};
        if (externalVideoLinksHtml) {
          files[`${projectFilenamePrefix}-external-video-links.html`] =
            new TextEncoder().encode(externalVideoLinksHtml);
        }

        const fetchResults = await Promise.allSettled(
          items.map(async ({ url, filename }) => {
            const res = await fetch(url, { mode: "cors" });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const buf = await res.arrayBuffer();
            return { filename, data: new Uint8Array(buf) };
          }),
        );

        for (const result of fetchResults) {
          if (result.status === "fulfilled") {
            files[result.value.filename] = result.value.data;
          } else {
            console.warn("ZIP: failed to fetch file", result.reason);
          }
        }

        if (Object.keys(files).length === 0) {
          toast.error(t("projectList.media.zipDownloadFailed"));
          return;
        }

        const zipped = await new Promise<Uint8Array>((resolve, reject) => {
          zip(files, { level: 0 }, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });

        const blob = new Blob([zipped.buffer as ArrayBuffer], {
          type: "application/zip",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${projectFilenamePrefix}-media.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch (e) {
        console.error("ZIP creation failed", e);
        toast.error(t("projectList.media.zipDownloadFailed"));
      } finally {
        setZipping(false);
      }
    }, [zipping, project.media, projectFilenamePrefix, t]);

    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => void handleDownloadAllMediaZip()}
            disabled={!canDownloadAll || zipping}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FolderArchive size={16} />
            {zipping ? "…" : t("projectList.media.downloadAll")}
          </button>
        </div>
        <div
          onDragOver={handleMediaSectionDragOver("render")}
          onDragEnter={handleMediaSectionDragOver("render")}
          onDragLeave={handleMediaSectionDragLeave("render")}
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <ImageIcon size={16} /> {t("projectList.media.renders")} (
              {renders.length})
            </h4>
            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
              {uploading === "render"
                ? t("projectList.media.uploading")
                : t("projectList.media.add")}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                multiple
                disabled={uploading !== null}
                onChange={(e) => void uploadFiles("render", e.target.files)}
              />
            </label>
          </div>
          {renderUploadProgresses.length > 0 ? (
            <div className="mb-4 space-y-3">
              {renderUploadProgresses.map((uploadProgress) => (
                <UploadProgressCard
                  key={uploadProgress.id}
                  fileName={uploadProgress.fileName}
                  fileSize={uploadProgress.fileSize}
                  progress={uploadProgress.progress}
                  status={uploadProgress.status}
                  icon={<ImageIcon className="h-8 w-8 text-sky-600" />}
                  onCancel={() => handleCancelMediaUpload(uploadProgress.id)}
                />
              ))}
            </div>
          ) : null}
          {uploading !== "render" ? (
            <FileDropzone
              accept="image/*"
              multiple
              size="compact"
              collapsed={renders.length > 0 && activeDropSection !== "render"}
              className="mb-4 border-2 border-dashed border-slate-200"
              heading={t("projectList.media.renders")}
              description={t("projectList.media.renderDropzoneDescription")}
              idleLabel={t("projectEditor.clickOrDrop")}
              dropLabel={t("projectEditor.clickOrDrop")}
              onFilesSelected={async (files) => {
                await uploadFiles("render", files);
              }}
            />
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {renders.map((url, i) => (
              <div
                key={`${url}-${i}`}
                className="group relative aspect-video overflow-hidden rounded-lg border border-slate-200"
              >
                <button
                  type="button"
                  onClick={() =>
                    void downloadByUrl(
                      url,
                      `${projectFilenamePrefix}-render-${i + 1}${extensionFromUrl(url, ".jpg")}`,
                    )
                  }
                  className="absolute right-10 top-2 z-10 rounded-md bg-white/90 p-1 text-slate-700 shadow-sm transition hover:bg-white"
                  title={t("projectList.media.download")}
                >
                  <Download size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteMedia(url)}
                  disabled={deletingUrl === url}
                  className="absolute right-2 top-2 z-10 rounded-md bg-white/90 p-1 text-red-600 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  title="Delete media"
                >
                  <Trash2 size={14} />
                </button>
                <img
                  src={url}
                  alt={`${t("projectList.media.renders")} ${i + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <button
                  type="button"
                  onClick={() =>
                    setPreviewMedia({
                      kind: "image",
                      url,
                      title: `${t("projectList.media.renders")} ${i + 1}`,
                    })
                  }
                  className="absolute inset-0 z-[1]"
                  title={t("projectList.media.renders")}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          onDragOver={handleMediaSectionDragOver("video")}
          onDragEnter={handleMediaSectionDragOver("video")}
          onDragLeave={handleMediaSectionDragLeave("video")}
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <PlayCircle size={16} /> {t("projectList.media.videos")} (
              {videos.length})
            </h4>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                onClick={() => {
                  setVideoLinksExpanded((prev) => !prev);
                  setVideoLinksError(null);
                }}
              >
                <Globe size={13} />
                {t("projectList.media.linksLabel")}
              </button>
              <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
                {uploading === "video"
                  ? t("projectList.media.uploading")
                  : t("projectList.media.add")}
                <input
                  type="file"
                  className="hidden"
                  accept="video/*"
                  multiple
                  disabled={uploading !== null}
                  onChange={(e) => {
                    handleVideoSelection(e.target.files);
                    e.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>
          {videoLinksExpanded && (
            <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <label className="mb-2 block text-xs font-bold text-slate-600">
                {t("projectList.media.linksLabel")}
              </label>
              <textarea
                value={videoLinksInput}
                onChange={(e) => {
                  setVideoLinksInput(e.target.value);
                  if (videoLinksError) setVideoLinksError(null);
                }}
                placeholder={t("projectList.media.linksPlaceholder")}
                className="min-h-[88px] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500">
                  {videoLinksError ?? t("projectList.media.linksHint")}
                </p>
                <button
                  type="button"
                  onClick={() => void addVideoLinks()}
                  disabled={addingVideoLinks || uploading !== null}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingVideoLinks
                    ? t("projectList.media.uploading")
                    : t("projectList.media.add")}
                </button>
              </div>
            </div>
          )}
          {uploading !== "video" ? (
            <FileDropzone
              accept="video/*"
              multiple
              size="compact"
              collapsed={videos.length > 0 && activeDropSection !== "video"}
              className="mb-4 border-2 border-dashed border-slate-200"
              heading={t("projectList.media.videos")}
              description={t("projectList.media.videoDropzoneDescription")}
              idleLabel={t("projectEditor.clickOrDrop")}
              dropLabel={t("projectEditor.clickOrDrop")}
              onFilesSelected={handleVideoFilesSelected}
            />
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((vid, i) => (
              <div key={`${vid.url}-${i}`} className="group relative">
                <button
                  type="button"
                  onClick={() =>
                    void downloadByUrl(
                      vid.url,
                      `${projectFilenamePrefix}-video-${i + 1}-${safeFilename(vid.title, "video")}${extensionFromUrl(vid.url, ".mp4")}`,
                    )
                  }
                  className="absolute right-10 top-2 z-10 rounded-md bg-white/90 p-1 text-slate-700 shadow-sm transition hover:bg-white"
                  title={t("projectList.media.download")}
                >
                  <Download size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteMedia(vid.url)}
                  disabled={deletingUrl === vid.url}
                  className="absolute right-2 top-2 z-10 rounded-md bg-white/90 p-1 text-red-600 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  title="Delete media"
                >
                  <Trash2 size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isExternalVideoUrl(vid.url)) {
                      window.open(vid.url, "_blank", "noopener,noreferrer");
                      return;
                    }
                    setPreviewMedia({
                      kind: "video",
                      url: vid.url,
                      title: vid.title,
                    });
                  }}
                  className="block w-full space-y-2 text-left"
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-black">
                    {vid.thumbnail ? (
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="h-full w-full object-cover opacity-80"
                      />
                    ) : isExternalVideoUrl(vid.url) ? (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                        <div className="text-center text-white/80">
                          <Globe size={24} className="mx-auto mb-2" />
                          <div className="text-xs font-bold uppercase">
                            {t("projectList.media.linksLabel")}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <video
                        src={vid.url}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover opacity-80"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md">
                        <PlayCircle size={20} />
                      </div>
                    </div>
                  </div>
                  <div className="truncate text-xs font-bold text-slate-700 group-hover:text-blue-600">
                    {vid.title}
                    {formatBytes(vid.sizeBytes)
                      ? ` (${formatBytes(vid.sizeBytes)})`
                      : ""}
                  </div>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div
          onDragOver={handleMediaSectionDragOver("presentation")}
          onDragEnter={handleMediaSectionDragOver("presentation")}
          onDragLeave={handleMediaSectionDragLeave("presentation")}
        >
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <FileText size={16} /> {t("projectList.media.presentations")} (
              {docs.length})
            </h4>
            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
              {uploading === "presentation"
                ? t("projectList.media.uploading")
                : t("projectList.media.add")}
              <input
                type="file"
                className="hidden"
                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                disabled={uploading !== null}
                onChange={(e) =>
                  void uploadFiles("presentation", e.target.files)
                }
              />
            </label>
          </div>
          {presentationUploadProgresses.length > 0 ? (
            <div className="mb-4 space-y-3">
              {presentationUploadProgresses.map((uploadProgress) => (
                <UploadProgressCard
                  key={uploadProgress.id}
                  fileName={uploadProgress.fileName}
                  fileSize={uploadProgress.fileSize}
                  progress={uploadProgress.progress}
                  status={uploadProgress.status}
                  icon={<FileText className="h-8 w-8 text-red-600" />}
                  onCancel={() => handleCancelMediaUpload(uploadProgress.id)}
                />
              ))}
            </div>
          ) : null}
          {uploading !== "presentation" ? (
            <FileDropzone
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              size="compact"
              collapsed={
                docs.length > 0 && activeDropSection !== "presentation"
              }
              className="mb-4 border-2 border-dashed border-slate-200"
              heading={t("projectList.media.presentations")}
              description={t(
                "projectList.media.presentationDropzoneDescription",
              )}
              idleLabel={t("projectEditor.clickOrDrop")}
              dropLabel={t("projectEditor.clickOrDrop")}
              onFilesSelected={async (files) => {
                await uploadFiles("presentation", files);
              }}
            />
          ) : null}
          <div className="space-y-2">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-blue-300"
              >
                <a
                  href={doc.url ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-3"
                >
                  <div className="rounded-lg bg-red-50 p-2 text-red-600">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900">
                      {doc.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {doc.uploadedAt
                        ? new Date(doc.uploadedAt).toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    doc.url &&
                    void downloadByUrl(
                      doc.url,
                      `${projectFilenamePrefix}-${safeFilename(doc.title, "document")}${extensionFromUrl(doc.url, ".pdf")}`,
                    )
                  }
                  disabled={!doc.url}
                  className="ml-2 rounded-md p-1 text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  title={t("projectList.media.download")}
                >
                  <Download size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => doc.url && void handleDeleteMedia(doc.url)}
                  disabled={!doc.url || deletingUrl === doc.url}
                  className="ml-3 rounded-md p-1 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Delete media"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {previewMedia &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 flex items-center justify-center bg-black/80 p-4"
              style={{ zIndex: 120 }}
              onClick={() => setPreviewMedia(null)}
            >
              <button
                type="button"
                onClick={() => setPreviewMedia(null)}
                className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
                title="Close preview"
              >
                <X size={20} />
              </button>
              <div
                className="max-h-[90vh] w-auto max-w-[calc(100vw-2rem)]"
                onClick={(e) => e.stopPropagation()}
              >
                {previewMedia.kind === "video" ? (
                  <video
                    src={previewMedia.url}
                    controls
                    autoPlay
                    className="block max-h-[90vh] w-auto max-w-full rounded-xl"
                  />
                ) : (
                  <img
                    src={previewMedia.url}
                    alt={previewMedia.title}
                    className="block max-h-[90vh] w-auto max-w-full rounded-xl object-contain"
                  />
                )}
              </div>
            </div>,
            document.body,
          )}

        <VideoUploadDialog
          open={videoUploadDialogOpen}
          uploading={uploading === "video"}
          items={pendingVideoUploads}
          onOpenChange={handleCloseVideoUploadDialog}
          onTitleChange={updatePendingVideoTitle}
          onThumbnailChange={updatePendingVideoThumbnail}
          onSubmit={() => void uploadPendingVideos()}
        />
      </div>
    );
  };

  if (loading) {
    const headerActionSlots = isCrmMode
      ? 0
      : adminAccess?.isDemoWorkspace
        ? 1
        : 2;

    const cardActionSlots = isCrmMode ? 1 : isManagerMode ? 2 : 3;

    return (
      <div className="space-y-5">
        <header className="flex flex-col gap-4 border-b border-border/70 bg-background/95 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Skeleton className="h-8 w-[12rem] sm:w-[16rem]" />
                <Skeleton className="h-6 w-24 shrink-0 rounded-full" />
              </div>
              <div className="max-w-[72ch] space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
            {headerActionSlots > 0 ? (
              <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
                {Array.from({ length: headerActionSlots }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-full sm:min-w-[10rem] sm:flex-1 lg:h-10 lg:w-44 lg:flex-none"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="px-4 pb-4 pt-4 md:px-6 md:pb-4 md:pt-6">
                <Skeleton className="h-7 w-[85%]" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-1 h-4 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4 pt-0 md:px-6 md:pb-6">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-6 w-28 rounded-md" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex min-h-6 items-center gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-5 w-9 rounded-md" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  {cardActionSlots >= 1 ? (
                    <Skeleton
                      className={cn(
                        "h-9 shrink-0 rounded-md",
                        cardActionSlots === 1 ? "w-full" : "flex-1",
                      )}
                    />
                  ) : null}
                  {cardActionSlots >= 2 ? (
                    <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                  ) : null}
                  {cardActionSlots >= 3 ? (
                    <Skeleton className="h-9 w-9 shrink-0 rounded-md" />
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ConfirmDialog
        open={projectPendingDeletion !== null}
        onOpenChange={(open) => {
          if (!open && deletingProjectId === null) {
            setProjectPendingDeletion(null);
          }
        }}
        tone="destructive"
        title={
          projectPendingDeletion
            ? t("projectList.deleteConfirm", {
                name: projectPendingDeletion.name,
              })
            : t("projectList.deleteConfirm", { name: "" })
        }
        description={t("projectList.deleteProject")}
        confirmLabel={t("projectList.deleteProject")}
        cancelLabel={t("common.cancel")}
        loading={deletingProjectId !== null}
        onConfirm={async () => {
          if (!projectPendingDeletion) return;
          await deleteProject(
            projectPendingDeletion.id,
            projectPendingDeletion.name,
          );
          setProjectPendingDeletion(null);
        }}
      />

      {/* Project Drawer */}
      {selectedProject && !isCrmMode && (
        <SharedProjectDrawer
          project={effectiveDrawerProject}
          mode="developer"
          onClose={handleCloseDrawer}
          onOpenPublicPage={handleOpenPublicPage}
          onNavigateToEditor={handleNavigateToEditor}
          renderUnitsTab={(p) =>
            drawerLoading ? (
              <div className="p-8 text-center text-slate-400">
                {t("projectList.media.loading")}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="p-8 text-center text-slate-400">
                    {t("projectList.media.loading")}
                  </div>
                }
              >
                <ProjectUnitsChessEditorTab projectId={p.id} />
              </Suspense>
            )
          }
          renderPartnersTab={(p) => <DeveloperPartnersTab project={p} />}
          renderMediaTab={(p) =>
            drawerLoading ? (
              <div className="p-8 text-center text-slate-400">
                {t("projectList.media.loading")}
              </div>
            ) : (
              <DeveloperMediaTab project={p} />
            )
          }
          renderConstructionTab={(p) =>
            drawerLoading ? (
              <div className="p-8 text-center text-slate-400">
                {t("projectList.media.loading")}
              </div>
            ) : (
              <DeveloperConstructionTab
                project={p}
                language={language}
                userId={user?.id}
                t={t}
                reloadProject={loadDrawerProject}
              />
            )
          }
        />
      )}

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <DataState
          icon={Building2}
          title={t("projectList.noProjects")}
          description={t("projectList.createFirstDescription")}
          action={
            !isCrmMode && onCreateNew
              ? {
                  label: t("projectList.createFirst"),
                  onClick: onCreateNew,
                  variant: "default",
                }
              : undefined
          }
          className="create_project_usertour min-h-[320px] items-center text-center"
        >
          {!isCrmMode && !adminAccess?.isDemoWorkspace && (
            <JoinDemoButton variant="inline" />
          )}
        </DataState>
      ) : (
        <div className="space-y-5">
          {/* Header with Create New Project Button */}
          <PageHeader
            title={t("projectList.projects")}
            description={t("projectList.manageDescription")}
            metadata={
              <StatusBadge tone="neutral">
                {projects.length} {t("projectList.projects")}
              </StatusBadge>
            }
            actions={
              <>
                {!isCrmMode && !adminAccess?.isDemoWorkspace && (
                  <JoinDemoButton variant="inline" />
                )}
                {!isCrmMode && onCreateNew && (
                  <Button
                    type="button"
                    onClick={onCreateNew}
                    className={cn(
                      adminThemeClasses.primary,
                      adminThemeClasses.primaryHover,
                      adminThemeClasses.primaryActive,
                      "create_project_usertour shadow-sm",
                      "w-auto max-[425px]:min-h-10 max-[425px]:w-full",
                    )}
                  >
                    <Plus className="size-5 shrink-0" />
                    {t("projectList.createNew")}
                  </Button>
                )}
              </>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const crmBlocked =
                isCrmMode &&
                !(adminAccess?.canUseCrmIntegration(project.id) ?? true);

              return (
                <Card
                  key={project.id}
                  className={`project_card_usertour group overflow-hidden transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 hover:border-ring/25 hover:shadow-md ${crmBlocked ? "opacity-75" : ""}`}
                >
                  <CardHeader className="px-4 pb-4 pt-4 md:px-6 md:pb-4 md:pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle
                          style={{ color: ADMIN_THEME.textPrimary }}
                          className="line-clamp-1 text-lg transition-colors"
                        >
                          {project.name}
                          {crmBlocked && (
                            <Crown className="ml-2 inline h-4 w-4 text-amber-500" />
                          )}
                        </CardTitle>
                        <CardDescription
                          style={{ color: ADMIN_THEME.textSecondary }}
                          className="mt-1 line-clamp-2"
                        >
                          {project.description || "-"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 md:px-6 md:pb-6">
                    <div className="space-y-4">
                      {project.building_image_url ? (
                        <div className="aspect-video overflow-hidden rounded-lg bg-real-estate-50">
                          <img
                            src={project.building_image_url}
                            alt={project.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div
                          className="flex aspect-video items-center justify-center rounded-lg bg-real-estate-100"
                          style={{
                            backgroundColor: ADMIN_THEME.backgroundSecondary,
                          }}
                        >
                          <Building2
                            className="h-12 w-12 text-real-estate-400"
                            style={{ color: ADMIN_THEME.textSecondary }}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <Badge
                            style={{ color: ADMIN_THEME.textSecondary }}
                            variant="outline"
                          >
                            {project.floors} {t("projectList.floors")}
                          </Badge>
                          <span style={{ color: ADMIN_THEME.textSecondary }}>
                            {new Date(project.created_at).toLocaleDateString(
                              "en-US",
                            )}
                          </span>
                        </div>

                        {isManagerMode && project.developer_info && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Building className="h-3 w-3" />
                            <span>
                              {project.developer_info.company_name ||
                                project.developer_info.full_name}
                            </span>
                          </div>
                        )}

                        <LeadsStats projectId={project.id} />
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {!isCrmMode && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenDrawer(project)}
                            className="flex-1 bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] hover:bg-[var(--admin-primary-hover)]"
                          >
                            <Info className="mr-2 h-4 w-4" />
                            {t("projectList.details")}
                          </Button>
                        )}

                        {isCrmMode && (
                          <Button
                            size="sm"
                            onClick={() => viewProject(project)}
                            disabled={crmBlocked}
                            title={
                              crmBlocked
                                ? t("bitrix.proGuard.title")
                                : undefined
                            }
                            className="flex-1 bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] hover:bg-[var(--admin-primary-hover)]"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t("managerAccounts.openLink")}
                          </Button>
                        )}

                        {!isCrmMode && onEditProject && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditProject(project.id, false)}
                            className="edit_project_usertour"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}

                        {!isCrmMode && !isManagerMode && !amoWidget && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setProjectPendingDeletion(project)}
                            className="text-destructive hover:bg-destructive/10"
                            disabled={deletingProjectId === project.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      {crmBlocked && (
                        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                          <div className="min-w-0 text-xs">
                            <p className="font-medium text-amber-900">
                              {t("bitrix.proGuard.description")}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `/${language}/admin?page=subscription`,
                                  "_blank",
                                  "noopener,noreferrer",
                                )
                              }
                              className="mt-1 font-semibold text-amber-700 underline hover:text-amber-900"
                            >
                              {t("bitrix.proGuard.cta")}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
