import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type SharedProject,
  SharedProjectDrawer,
} from "@gridix/ui";
import {
  Building,
  Building2,
  Download,
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
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import {
  Project,
  useWorkspaceProjects,
} from "@/entities/workspace/queries/useWorkspaceProjects";
import { useProjectCRUD } from "@/entities/project/queries/useProjects";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LeadsStats } from "@/entities/lead/ui/LeadsNotification";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import { supabase } from "@gridix/utils/api";
import Spinner from "@/shared/ui/Spinner.tsx";
import { DeveloperConstructionTab } from "./DeveloperConstructionTab";
import {
  type PendingVideoUpload,
  VideoUploadDialog,
} from "./VideoUploadDialog";

const ProjectUnitsChessEditorTab = lazy(
  () => import("@/components/projects/ProjectUnitsChessEditorTab"),
);

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

  const isCrmMode = mode === "crm";

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

    if (!confirm(t("projectList.deleteConfirm", { name: projectName }))) {
      return;
    }

    const success = await deleteProjectCRUD(projectId);
    if (success) {
      refresh(); // Обновляем список проектов
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

  const loadDrawerProject = async (projectId: string) => {
    setDrawerLoading(true);
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
      setDrawerProject(null);
    } finally {
      setDrawerLoading(false);
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
    const [uploading, setUploading] = useState<
      null | "render" | "video" | "presentation"
    >(null);
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
    const [videoUploadDialogOpen, setVideoUploadDialogOpen] = useState(false);
    const [pendingVideoUploads, setPendingVideoUploads] = useState<
      PendingVideoUpload[]
    >([]);
    const [previewMedia, setPreviewMedia] = useState<{
      kind: "image" | "video";
      url: string;
      title: string;
    } | null>(null);

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
      return () => {
        pendingVideoUploads.forEach((item) => {
          URL.revokeObjectURL(item.filePreviewUrl);
          if (item.thumbnailPreviewUrl) {
            URL.revokeObjectURL(item.thumbnailPreviewUrl);
          }
        });
      };
    }, [pendingVideoUploads]);

    const uploadFiles = async (
      kind: "render" | "video" | "presentation",
      files: FileList | null,
    ) => {
      if (!files || files.length === 0) return;
      if (!user) {
        toast.error(t("projectList.authRequired"));
        return;
      }

      setUploading(kind);
      try {
        for (const file of Array.from(files)) {
          const form = new FormData();
          form.set("action", "upload_media_item");
          form.set("project_id", project.id);
          form.set("kind", kind);
          form.set("file", file);
          if (kind === "presentation") {
            form.set("title", file.name.replace(/\.[^/.]+$/, ""));
          }

          const { data, error: invokeErr } = await supabase.functions.invoke(
            "project-drawer",
            { body: form },
          );
          if (invokeErr) throw invokeErr;
          if (data?.error) throw new Error(String(data.error));
        }
        toast.success(t("projectList.media.uploadSuccess"));
        await loadDrawerProject(project.id);
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
        await loadDrawerProject(project.id);
      } catch (e) {
        console.error("Failed to upload videos", e);
        toast.error(t("projectList.media.uploadError"));
      } finally {
        setUploading(null);
      }
    };

    const handleDeleteMedia = async (url: string) => {
      if (!url || deletingUrl) return;
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
        await loadDrawerProject(project.id);
      } catch (e) {
        console.error("Failed to delete media", e);
        toast.error("Failed to delete media");
      } finally {
        setDeletingUrl(null);
      }
    };

    const renders = project.media?.renders ?? [];
    const videos = project.media?.videos ?? [];
    const docs = project.media?.presentations ?? [];
    const projectFilenamePrefix = safeFilename(project.name, "project");

    return (
      <div className="space-y-8 p-6">
        <div>
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

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <PlayCircle size={16} /> {t("projectList.media.videos")} (
              {videos.length})
            </h4>
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
                  onClick={() =>
                    setPreviewMedia({
                      kind: "video",
                      url: vid.url,
                      title: vid.title,
                    })
                  }
                  className="block w-full space-y-2 text-left"
                >
                  <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-black">
                    {vid.thumbnail ? (
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="h-full w-full object-cover opacity-80"
                      />
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

        <div>
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
    return (
      <div className="grid h-full w-full place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="mb-4 h-16 w-16" />
            <h3 className="mb-2 text-xl font-semibold">
              {t("projectList.noProjects")}
            </h3>
            <p className="mb-6 max-w-md text-center">
              {t("projectList.createFirstDescription")}
            </p>
            {!isCrmMode && onCreateNew && (
              <Button
                onClick={onCreateNew}
                size="lg"
                className="create_project_usertour"
                style={{
                  backgroundColor: ADMIN_THEME.primary,
                  color: ADMIN_THEME.textOnPrimary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    ADMIN_THEME.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                }}
              >
                <Plus className="mr-2 h-5 w-5" />
                {t("projectList.createFirst")}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Header with Create New Project Button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2
                style={{ color: ADMIN_THEME.textPrimary }}
                className="text-xl font-semibold"
              >
                {t("projectList.projects")}
              </h2>
              <p style={{ color: ADMIN_THEME.textSecondary }}>
                {t("projectList.manageDescription")}
              </p>
            </div>
            {!isCrmMode && onCreateNew && (
              <Button
                onClick={onCreateNew}
                className="create_project_usertour w-full md:w-auto"
                style={{
                  backgroundColor: ADMIN_THEME.primary,
                  color: ADMIN_THEME.textOnPrimary,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    ADMIN_THEME.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = ADMIN_THEME.primary;
                }}
              >
                <Plus className="mr-2 h-5 w-5" />
                {t("projectList.createNew")}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="project_card_usertour group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle
                        style={{ color: ADMIN_THEME.textPrimary }}
                        className="line-clamp-1 text-lg transition-colors"
                      >
                        {project.name}
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
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Project Image */}
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

                    {/* Project Info */}
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

                      {/* Developer Info для менеджеров */}
                      {isManagerMode && project.developer_info && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Building className="h-3 w-3" />
                          <span>
                            {project.developer_info.company_name ||
                              project.developer_info.full_name}
                          </span>
                        </div>
                      )}

                      {/* Leads Stats */}
                      <LeadsStats projectId={project.id} />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      {/* In admin mode, show details button that opens drawer */}
                      {!isCrmMode && (
                        <Button
                          size="sm"
                          onClick={() => handleOpenDrawer(project)}
                          className="flex-1"
                          style={{
                            backgroundColor: ADMIN_THEME.primary,
                            color: ADMIN_THEME.textOnPrimary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              ADMIN_THEME.primaryHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              ADMIN_THEME.primary;
                          }}
                        >
                          <Info className="mr-2 h-4 w-4" />
                          {t("projectList.details")}
                        </Button>
                      )}

                      {/* In CRM mode, directly open embed */}
                      {isCrmMode && (
                        <Button
                          size="sm"
                          onClick={() => viewProject(project)}
                          className="flex-1"
                          style={{
                            backgroundColor: ADMIN_THEME.primary,
                            color: ADMIN_THEME.textOnPrimary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              ADMIN_THEME.primaryHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              ADMIN_THEME.primary;
                          }}
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
                          style={{
                            borderColor: ADMIN_THEME.primary,
                            color: ADMIN_THEME.primary,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              ADMIN_THEME.backgroundHover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}

                      {/* Кнопка удаления скрыта для менеджеров */}
                      {!isCrmMode && !isManagerMode && !amoWidget && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            deleteProject(project.id, project.name)
                          }
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
