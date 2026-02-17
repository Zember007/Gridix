import React, {ReactNode, useState} from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  MapPin,
  Building2,
  Info,
  LayoutGrid,
  Hammer,
  Lock,
  Share2,
  FileText,
  Download,
  ExternalLink,
  Handshake,
  Clock,
  Image as ImageIcon,
  PlayCircle,
  FolderArchive,
} from "lucide-react";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@gridix/ui";

// --- Types ---

export interface ProjectMedia {
  renders?: string[];
  videos?: Array<{ url: string; title: string; thumbnail?: string }>;
  presentations?: Array<{
    id: string;
    title: string;
    url?: string;
    uploadedAt?: string;
  }>;
}

export interface ConstructionUpdate {
  id: string;
  date: string;
  title: string;
  description: string;
  images?: string[];
}

export interface ProjectPartnershipSettings {
  isEnabled: boolean;
  allowPartnerConnect?: boolean;
  commissionType: "percent" | "fixed";
  commissionValue: number;
  payoutCondition?: string;
  contractUrl?: string;
}

export interface ProjectUnit {
  id: string;
  number: string;
  floor: number;
  rooms: string;
  area: number;
  price: number;
  status: "available" | "booked" | "sold" | "unavailable";
}

export interface SharedProject {
  id: string;
  name: string;
  location?: string | undefined;
  developerName?: string | undefined;
  imageUrl?: string | undefined;
  description?: string | undefined;
  completionDate?: string | undefined;
  floors?: number | undefined;
  minPrice?: number | undefined;
  totalUnits?: number | undefined;
  availableUnits?: number | undefined;
  yield?: number | undefined;
  commissionPercent?: number | undefined;
  commissionCondition?: string | undefined;
  partnershipStatus?: "none" | "pending" | "active" | undefined;
  partnershipSettings?: ProjectPartnershipSettings | undefined;
  media?: ProjectMedia | undefined;
  constructionProgress?: ConstructionUpdate[] | undefined;
  stats?:
    | {
        totalUnits: number;
        availableUnits: number;
        soldUnits: number;
        bookedUnits: number;
        totalArea: number;
      }
    | undefined;
}

export type SharedProjectDrawerMode = "agent" | "developer" | "catalog";
export type SharedProjectDrawerTab =
  | "overview"
  | "units"
  | "construction"
  | "media"
  | "partners"
  | "settings";

export interface SharedProjectDrawerProps {
  project: SharedProject | null;
  mode: SharedProjectDrawerMode;
  onClose: () => void;
  zIndex?: number;

  // Agent/Catalog mode actions
  onLock?: (project: SharedProject) => void;
  onConnect?: (project: SharedProject) => void;
  onFavorite?: (project: SharedProject) => void;
  onShare?: (project: SharedProject) => void;
  onOpenPublicPage?: (project: SharedProject) => void;

  // Developer mode actions
  onUpdate?: (id: string, updates: Partial<SharedProject>) => void;
  onNavigateToEditor?: (projectId: string) => void;

  // Custom content renderers
  renderUnitsTab?: (project: SharedProject) => React.ReactNode;
  renderMediaTab?: (project: SharedProject) => React.ReactNode;
  renderConstructionTab?: (project: SharedProject) => React.ReactNode;
  renderPartnersTab?: (project: SharedProject) => React.ReactNode;
  renderSettingsTab?: (project: SharedProject) => React.ReactNode;

  // Initial tab
  initialTab?: SharedProjectDrawerTab;
}

// --- Tab Components ---

const OverviewTab: React.FC<{
  project: SharedProject;
  t: (key: string, params?: Record<string, unknown>) => string;
}> = ({ project, t }) => {
  const isConnected = project.partnershipStatus === "active";

  return (
    <div className="space-y-6 p-6">
      {/* Commission Block */}
      {/*     <div
        className={`border rounded-xl p-4 flex gap-3 ${
          isConnected ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-200"
        }`}
      >
        <div
          className={`p-2 rounded-lg shrink-0 h-fit ${
            isConnected ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
          }`}
        >
          <Wallet size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold text-sm ${isConnected ? "text-emerald-900" : "text-slate-700"}`}>
              {t("drawer.commission.title")}: {project.commissionPercent ?? 5}%
            </h4>
            {isConnected ? (
              <span className="text-[10px] bg-white px-2 py-0.5 rounded text-emerald-700 font-bold border border-emerald-200">
                {t("drawer.commission.active")}
              </span>
            ) : (
              <span className="text-[10px] bg-white px-2 py-0.5 rounded text-slate-500 font-bold border border-slate-200">
                {t("drawer.commission.requiresContract")}
              </span>
            )}
          </div>
          <p className={`text-xs leading-relaxed font-medium ${isConnected ? "text-emerald-700" : "text-slate-500"}`}>
            {isConnected
              ? `${t("drawer.commission.condition")}: ${project.commissionCondition ?? ""}`
              : t("drawer.commission.signOffer")}
          </p>
        </div>
      </div> */}

      {/* Stats Grid */}
      {/*    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t("drawer.stats.roi")}</div>
          <div className="text-lg font-bold text-[var(--admin-primary)]">{project.yield ? `${project.yield}%` : "—"}</div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t("drawer.stats.completion")}</div>
          <div className="text-lg font-bold text-slate-900">
            {project.completionDate ? new Date(project.completionDate).getFullYear() : "—"}
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t("drawer.stats.priceFrom")}</div>
          <div className="text-lg font-bold text-slate-900">
            {project.minPrice ? `$${(project.minPrice / 1000).toFixed(0)}k` : "—"}
          </div>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t("drawer.stats.units")}</div>
          <div className="text-lg font-bold text-slate-900">{project.availableUnits ?? project.totalUnits ?? "—"}</div>
        </div>
      </div> */}

      {/* About */}
      <div>
        <h3 className="mb-3 text-sm font-bold tracking-wider text-slate-500 uppercase">
          {t("drawer.about.title")}
        </h3>
        <p className="text-sm leading-relaxed text-slate-600">
          {project.description ?? "-"}
        </p>
      </div>

      {/* Quick Downloads */}
      {isConnected &&
        project.media?.presentations &&
        project.media.presentations.length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-bold tracking-wider text-slate-500 uppercase">
              {t("drawer.quickAccess")}
            </h3>
            <a
              href="#"
              className="group flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 transition-colors hover:bg-slate-50"
            >
              <div className="rounded-lg bg-[var(--admin-background-secondary)] p-2 text-[var(--admin-primary)] group-hover:bg-[var(--admin-background-hover)]">
                <FileText size={18} />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {project.media.presentations[0]?.title}
              </span>
              <Download
                size={16}
                className="ml-auto text-slate-400 group-hover:text-[var(--admin-primary)]"
              />
            </a>
          </div>
        )}
    </div>
  );
};

/** Sanitize string for use in filename (remove path chars, limit length) */
function safeFilename(name: string, maxLength = 80): string {
  return (
    name
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength) || "file"
  );
}

/** Get file extension from URL or default (e.g. for images) */
function extFromUrl(url: string, defaultExt: string): string {
  try {
    const path = url.split("?")[0] ?? "";
    const last = path.split("/").pop() ?? "";
    const dot = last.lastIndexOf(".");
    if (dot > 0) return last.slice(dot);
  } catch {
    /* ignore */
  }
  return defaultExt.startsWith(".") ? defaultExt : `.${defaultExt}`;
}

/** Trigger download of a URL with given filename; on CORS failure opens in new tab */
function downloadFile(url: string, filename: string): void {
  fetch(url, { mode: "cors" })
    .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("Not ok"))))
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
}

const MediaTab: React.FC<{
  project: SharedProject;
  isConnected: boolean;
  onConnect?: ((project: SharedProject) => void) | undefined;
  t: (key: string, params?: Record<string, unknown>) => string;
}> = ({ project, isConnected, onConnect, t }) => {
  const media = project.media;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <Lock size={32} className="mb-3 text-slate-300" />
        <p className="font-bold text-slate-500">
          {t("drawer.media.restricted")}
        </p>
        <p className="mt-1 mb-4 text-xs text-slate-400">
          {t("drawer.media.signToAccess")}
        </p>
        {project.partnershipSettings?.allowPartnerConnect === false ? null : (
          <button
            type="button"
            onClick={() => onConnect?.(project)}
            className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-xs font-bold text-[var(--admin-text-on-primary)] hover:bg-[var(--admin-primary-hover)]"
          >
            {t("drawer.media.connect")}
          </button>
        )}
      </div>
    );
  }

  if (!media) {
    return (
      <div className="p-10 text-center text-slate-400">
        {t("drawer.media.noMaterials")}
      </div>
    );
  }

  const { renders, videos, presentations } = media;
  const projectName = safeFilename(project.name);

  const handleDownloadAll = () => {
    const items: Array<{ url: string; filename: string }> = [];
    renders?.forEach((url, i) => {
      items.push({
        url,
        filename: `${projectName}-render-${i + 1}${extFromUrl(url, ".jpg")}`,
      });
    });
    videos?.forEach((vid, i) => {
      items.push({
        url: vid.url,
        filename: `${projectName}-video-${i + 1}-${safeFilename(vid.title)}${extFromUrl(vid.url, ".mp4")}`,
      });
    });
    presentations?.forEach((doc) => {
      if (doc.url) {
        items.push({
          url: doc.url,
          filename: `${projectName}-${safeFilename(doc.title)}.pdf`,
        });
      }
    });
    items.forEach((item, index) => {
      setTimeout(() => downloadFile(item.url, item.filename), index * 250);
    });
  };

  const handleDownloadRender = (url: string, index: number) => {
    downloadFile(
      url,
      `${projectName}-render-${index + 1}${extFromUrl(url, ".jpg")}`,
    );
  };

  const handleDownloadVideo = (vid: { url: string; title: string }) => {
    downloadFile(
      vid.url,
      `${projectName}-${safeFilename(vid.title)}${extFromUrl(vid.url, ".mp4")}`,
    );
  };

  const handleDownloadPresentation = (doc: { url?: string; title: string }) => {
    if (doc.url)
      downloadFile(doc.url, `${projectName}-${safeFilename(doc.title)}.pdf`);
  };

  const downloadAllItemCount =
    (renders?.length ?? 0) +
    (videos?.length ?? 0) +
    (presentations?.filter((d) => d.url).length ?? 0);
  const canDownloadAll = downloadAllItemCount > 0;

  return (
    <div className="space-y-8 p-6">
      {/* Header Actions */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
          {t("drawer.media.title")}
        </h4>
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={!canDownloadAll}
          className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FolderArchive size={16} />
          {t("drawer.media.downloadAll")}
        </button>
      </div>

      {/* Renders */}
      {renders && renders.length > 0 && (
        <div>
          <h5 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <ImageIcon size={14} />
            {t("drawer.media.renders")}
          </h5>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {renders.map((url, i) => (
              <button
                type="button"
                key={`render-${i}`}
                onClick={() => handleDownloadRender(url, i)}
                className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg border border-slate-200 text-left focus:ring-2 focus:ring-[var(--admin-primary)] focus:ring-offset-2 focus:outline-none"
              >
                <img
                  src={url}
                  alt={`Render ${i}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Download size={20} className="text-white" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos && videos.length > 0 && (
        <div>
          <h5 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <PlayCircle size={14} />
            {t("drawer.media.videos")}
          </h5>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {videos.map((vid, i) => (
              <button
                type="button"
                key={`video-${i}`}
                onClick={() => handleDownloadVideo(vid)}
                className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-black text-left focus:ring-2 focus:ring-[var(--admin-primary)] focus:ring-offset-2 focus:outline-none"
              >
                <img
                  src={vid.thumbnail ?? ""}
                  alt={vid.title}
                  className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-60"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur-md">
                    <PlayCircle size={20} fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 text-xs font-bold text-white">
                  {vid.title}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Presentations */}
      {presentations && presentations.length > 0 && (
        <div>
          <h5 className="mb-3 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
            <FileText size={14} />
            {t("drawer.media.presentations")}
          </h5>
          <div className="space-y-2">
            {presentations.map((doc) => (
              <div
                key={doc.id}
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-[var(--admin-primary)]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-red-50 p-2 text-red-600">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {doc.title}
                    </div>
                    <div className="text-[10px] text-slate-400">PDF</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPresentation(doc)}
                  disabled={!doc.url}
                  className="rounded p-2 text-slate-400 transition-colors hover:bg-[var(--admin-background-hover)] hover:text-[var(--admin-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  title={doc.url ? "Download" : undefined}
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ConstructionTab: React.FC<{
  project: SharedProject;
  t: (key: string, params?: Record<string, unknown>) => string;
}> = ({ project, t }) => {
  const updates = project.constructionProgress ?? [];

  return (
    <div className="p-6">
      <h4 className="mb-6 text-sm font-bold tracking-wider text-slate-900 uppercase">
        {t("drawer.construction.title")}
      </h4>
      {updates.length === 0 ? (
        <div className="text-sm text-slate-400 italic">
          {t("drawer.construction.noUpdates")}
        </div>
      ) : (
        <div className="relative space-y-8 border-l border-slate-200 pl-4">
          {updates.map((update) => (
            <div key={update.id} className="relative pl-6">
              <div className="absolute top-1 -left-[21px] h-3 w-3 rounded-full bg-[var(--admin-primary)] ring-4 ring-white" />
              <div className="mb-1 text-xs font-bold text-slate-400">
                {new Date(update.date).toLocaleDateString()}
              </div>
              <h4 className="mb-1 text-sm font-bold text-slate-900">
                {update.title}
              </h4>
              <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                {update.description}
              </p>
              {update.images && update.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {update.images.slice(0, 3).map((img, i) => (
                    <img
                      key={`img-${i}`}
                      src={img}
                      alt={`Update ${i}`}
                      className="aspect-video rounded-lg border border-slate-200 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

export const SharedProjectDrawer: React.FC<SharedProjectDrawerProps> = ({
  project,
  mode,
  onClose,
  zIndex = 50,
  onLock,
  onConnect,
  onShare,
  onOpenPublicPage,
  onUpdate: _onUpdate,
  onNavigateToEditor,
  renderUnitsTab,
  renderMediaTab,
  renderConstructionTab,
  renderSettingsTab,
  initialTab = "overview",
}) => {
  void _onUpdate; // Reserved for future use
  const { t: tRaw } = useTranslation();
  const t = (key: string, params?: Record<string, unknown>): string =>
    tRaw(key, (params ?? {}) as Record<string, string | number>);
  const [activeTab, setActiveTab] =
    useState<SharedProjectDrawerTab>(initialTab);

  if (!project) return null;

  const isConnected = project.partnershipStatus === "active";
  const isPending = project.partnershipStatus === "pending";
  const allowPartnerConnect =
    project.partnershipSettings?.allowPartnerConnect ?? true;
  const isAgent = mode === "agent" || mode === "catalog";
  const isDeveloper = mode === "developer";

  // Determine available tabs based on mode
  const tabs:Array<{ id: SharedProjectDrawerTab, label: string, icon: ReactNode }> = [
    { id: "overview", label: t("drawer.tabs.overview"), icon: <Info size={16} /> },
    { id: "units", label: t("drawer.tabs.units"), icon: <LayoutGrid size={16} /> },
    { id: "media", label: t("drawer.tabs.media"), icon: <ImageIcon size={16} /> },
    { id: "construction", label: t("drawer.tabs.construction"), icon: <Hammer size={16} /> },
  ];
  const active = tabs.find((x) => x.id === activeTab) ?? tabs[0];
  /*
  if (isDeveloper) {
    tabs.push({ id: "partners", label: t("drawer.tabs.partners"), icon: <Handshake size={16} /> });
  }
  */

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm"
        style={{ zIndex: zIndex - 1 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="animate-in slide-in-from-right fixed inset-y-0 right-0 !mt-0 flex w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-2xl duration-300"
        style={{ zIndex }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-48 shrink-0 bg-slate-100">
          {project.imageUrl ? (
            <div className="absolute inset-0">
              <img
                src={project.imageUrl}
                alt={project.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
              <Building2 size={64} className="text-white/10" />
            </div>
          )}
          <div className="absolute right-0 bottom-0 left-0 z-10 p-6 text-white">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={14} />
              {project.location ?? ""}
            </div>
          </div>
          {project.developerName && (
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md">
              <Building2 size={12} />
              {project.developerName}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 rounded-full bg-white/20 p-2 text-white backdrop-blur-md transition-colors hover:bg-white/30"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className={'block md:hidden w-full bg-muted px-6 py-2'}>
          <Select value={activeTab} onValueChange={(value) => setActiveTab(value as SharedProjectDrawerTab)}>
          <SelectTrigger className="h-9 bg-white w-full">
            <div className="flex items-center gap-2 min-w-0 w-full">
            <SelectValue className={'flex justify-between'} placeholder={active?.label}/>
            </div>
          </SelectTrigger>
          <SelectContent className={'bg-muted w-[var(--radix-select-trigger-width)]'}
                         position="popper"
                         sideOffset={4}>

            {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  <div className="flex items-center gap-2">
                    {tab.icon}
                  {tab.label}
                  </div>
                </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
        <div className="md:grid hidden grid grid-cols-2 sm:grid-cols-4 border-b border-slate-200 px-6 bg-muted shrink-0 overflow-x-auto no-scrollbar">

          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-bold transition-colors ${
                activeTab === tab.id
                  ? "border-[var(--admin-primary)] text-[var(--admin-primary)]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {activeTab === "overview" && <OverviewTab project={project} t={t} />}
          {activeTab === "units" &&
            (renderUnitsTab ? (
              renderUnitsTab(project)
            ) : (
              <div className="p-8 text-center text-slate-400">
                Units view not implemented
              </div>
            ))}
          {activeTab === "media" &&
            (renderMediaTab ? (
              renderMediaTab(project)
            ) : (
              <MediaTab
                project={project}
                isConnected={isConnected}
                onConnect={onConnect}
                t={t}
              />
            ))}
          {activeTab === "construction" &&
            (renderConstructionTab ? (
              renderConstructionTab(project)
            ) : (
              <ConstructionTab project={project} t={t} />
            ))}
          {/*
          {activeTab === "partners" &&
            isDeveloper &&
            (renderPartnersTab ? (
              renderPartnersTab(project)
            ) : (
              <div className="p-8 text-center text-slate-400">Partners view not implemented</div>
            ))}
          */}
          {activeTab === "settings" &&
            isDeveloper &&
            (renderSettingsTab ? (
              renderSettingsTab(project)
            ) : (
              <div className="p-8 text-center text-slate-400">
                Settings not implemented
              </div>
            ))}
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center gap-3 border-t border-slate-200 bg-white p-4">
          {isAgent && (
            <>
              {isConnected ? (
                <button
                  type="button"
                  onClick={() => onLock?.(project)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--admin-primary)] py-3 font-bold text-[var(--admin-text-on-primary)] shadow-md shadow-slate-200 transition-all hover:bg-[var(--admin-primary-hover)]"
                >
                  <Lock size={16} />
                  {t("drawer.actions.lock")}
                </button>
              ) : isPending ? (
                <div className="flex flex-1 cursor-default items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-bold text-slate-500">
                  <Clock size={16} />
                  {t("drawer.actions.pendingConfirmation")}
                </div>
              ) : !allowPartnerConnect ? (
                <div className="flex flex-1 cursor-default items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-bold text-slate-500">
                  <Handshake size={16} />
                  {t("drawer.actions.partnershipUnavailable")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onConnect?.(project)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 font-bold text-white shadow-md transition-all hover:bg-slate-800"
                >
                  <Handshake size={16} />
                  {t("drawer.actions.becomePartner")}
                </button>
              )}
              <button
                type="button"
                onClick={() => onShare?.(project)}
                className="h-full rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Share2 size={16} />
              </button>
            </>
          )}

          {isDeveloper && (
            <>
              <button
                type="button"
                onClick={() => onOpenPublicPage?.(project)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--admin-primary)] py-3 font-bold text-[var(--admin-text-on-primary)] shadow-md shadow-slate-200 transition-all hover:bg-[var(--admin-primary-hover)]"
              >
                <ExternalLink size={16} />
                {t("drawer.actions.openPage")}
              </button>
              <button
                type="button"
                onClick={() => onNavigateToEditor?.(project.id)}
                className="h-full rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Building2 size={16} />
              </button>
            </>
          )}
        </footer>
      </div>
    </>
  );
};
