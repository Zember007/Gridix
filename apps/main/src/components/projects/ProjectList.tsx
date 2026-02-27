import { Suspense, lazy, useEffect, useMemo, useState } from "react";
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
import { LeadsStats } from "@/components/admin/LeadsNotification";
import { useAmoWidget } from "@/hooks/useAmoWidget";
import { supabase } from "@gridix/utils/api";
import Spinner from "@/shared/ui/Spinner.tsx";

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
      media: p?.media ?? undefined,
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

  const DeveloperConstructionTab = ({
    project,
  }: {
    project: SharedProject;
  }) => {
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newDate, setNewDate] = useState(
      () => new Date().toISOString().split("T")[0],
    );

    const addUpdate = async () => {
      if (!newTitle.trim() || !newDesc.trim()) return;
      try {
        const { error } = await supabase.functions.invoke("project-drawer", {
          body: {
            action: "add_construction_update",
            project_id: project.id,
            date: newDate,
            title: newTitle,
            description: newDesc,
            images: [],
          },
        });
        if (error) throw error;
        toast.success("Обновление добавлено");
        setNewTitle("");
        setNewDesc("");
        await loadDrawerProject(project.id);
      } catch (e) {
        console.error("Failed to add construction update", e);
        toast.error("Не удалось добавить обновление");
      }
    };

    const deleteUpdate = async (id: string) => {
      try {
        const { error } = await supabase.functions.invoke("project-drawer", {
          body: {
            action: "delete_construction_update",
            project_id: project.id,
            id,
          },
        });
        if (error) throw error;
        toast.success("Удалено");
        await loadDrawerProject(project.id);
      } catch (e) {
        console.error("Failed to delete construction update", e);
        toast.error("Не удалось удалить");
      }
    };

    const updates = project.constructionProgress ?? [];

    return (
      <div className="p-6">
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
            Добавить новость
          </h4>
          <div className="space-y-3">
            <input
              type="date"
              lang={language}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded border p-2 text-sm"
            />
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Заголовок"
              className="w-full rounded border p-2 text-sm"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Описание…"
              className="h-20 w-full resize-none rounded border p-2 text-sm"
            />
            <button
              type="button"
              onClick={addUpdate}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
            >
              <Plus size={16} /> Опубликовать
            </button>
          </div>
        </div>

        <div className="relative space-y-8 border-l border-slate-200 pl-4">
          {updates.length === 0 && (
            <div className="pl-4 text-sm italic text-slate-400">
              Нет обновлений
            </div>
          )}
          {updates.map((u) => (
            <div key={u.id} className="relative pl-6">
              <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white" />
              <div className="flex items-start justify-between gap-4">
                <div className="grow">
                  <div className="mb-1 text-xs font-bold text-slate-400">
                    {new Date(u.date).toLocaleDateString()}
                  </div>
                  <h4 className="mb-1 text-sm font-bold text-slate-900">
                    {u.title}
                  </h4>
                  <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                    {u.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteUpdate(u.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  title="Удалить"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DeveloperMediaTab = ({ project }: { project: SharedProject }) => {
    const [uploading, setUploading] = useState<
      null | "render" | "video" | "presentation"
    >(null);

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
          const safeName = file.name.replace(/\//g, "_");
          const filePath = `${user.id}/${project.id}/drawer_media/${kind}/${Date.now()}_${safeName}`;
          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
              contentType: file.type || "application/octet-stream",
            });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage
            .from("project-files")
            .getPublicUrl(filePath);
          const publicUrl = urlData.publicUrl;

          const title =
            kind === "presentation" || kind === "video"
              ? safeName.replace(/\.[^/.]+$/, "")
              : null;

          const { error: addErr } = await supabase.functions.invoke(
            "project-drawer",
            {
              body: {
                action: "add_media_item",
                project_id: project.id,
                kind,
                url: publicUrl,
                title,
              },
            },
          );
          if (addErr) throw addErr;
        }
        toast.success("Материалы загружены");
        await loadDrawerProject(project.id);
      } catch (e) {
        console.error("Failed to upload media", e);
        toast.error("Не удалось загрузить материалы");
      } finally {
        setUploading(null);
      }
    };

    const renders = project.media?.renders ?? [];
    const videos = project.media?.videos ?? [];
    const docs = project.media?.presentations ?? [];

    return (
      <div className="space-y-8 p-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <ImageIcon size={16} /> Рендеры ({renders.length})
            </h4>
            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
              {uploading === "render" ? "Загрузка…" : "Добавить"}
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
                <img
                  src={url}
                  alt={`Render ${i}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <PlayCircle size={16} /> Видео ({videos.length})
            </h4>
            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
              {uploading === "video" ? "Загрузка…" : "Добавить"}
              <input
                type="file"
                className="hidden"
                accept="video/*"
                multiple
                disabled={uploading !== null}
                onChange={(e) => void uploadFiles("video", e.target.files)}
              />
            </label>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((vid, i) => (
              <a
                key={`${vid.url}-${i}`}
                href={vid.url}
                target="_blank"
                rel="noreferrer"
                className="group space-y-2"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg border border-slate-200 bg-black">
                  {vid.thumbnail ? (
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="h-full w-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-white/50">
                      NO PREVIEW
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md">
                      <PlayCircle size={20} />
                    </div>
                  </div>
                </div>
                <div className="truncate text-xs font-bold text-slate-700 group-hover:text-blue-600">
                  {vid.title}
                </div>
              </a>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900">
              <FileText size={16} /> Презентации ({docs.length})
            </h4>
            <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline">
              {uploading === "presentation" ? "Загрузка…" : "Добавить"}
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
              <a
                key={doc.id}
                href={doc.url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-blue-300"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-2 text-red-600">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {doc.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {doc.uploadedAt
                        ? new Date(doc.uploadedAt).toLocaleDateString()
                        : ""}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
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
                {t("common.common.loading")}
              </div>
            ) : (
              <Suspense
                fallback={
                  <div className="p-8 text-center text-slate-400">
                    {t("common.common.loading")}
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
              <div className="p-8 text-center text-slate-400">Загрузка…</div>
            ) : (
              <DeveloperMediaTab project={p} />
            )
          }
          renderConstructionTab={(p) =>
            drawerLoading ? (
              <div className="p-8 text-center text-slate-400">Загрузка…</div>
            ) : (
              <DeveloperConstructionTab project={p} />
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
