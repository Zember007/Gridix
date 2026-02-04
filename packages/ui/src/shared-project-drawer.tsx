import React, { useState } from "react";
import {
  X,
  MapPin,
  Building2,
  Wallet,
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

// --- Types ---

export interface ProjectMedia {
  renders?: string[];
  videos?: Array<{ url: string; title: string; thumbnail?: string }>;
  presentations?: Array<{ id: string; title: string; url?: string; uploadedAt?: string }>;
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
  stats?: {
    totalUnits: number;
    availableUnits: number;
    soldUnits: number;
    bookedUnits: number;
    totalArea: number;
  } | undefined;
}

export type SharedProjectDrawerMode = "agent" | "developer" | "catalog";
export type SharedProjectDrawerTab = "overview" | "units" | "construction" | "media" | "partners" | "settings";

export interface SharedProjectDrawerProps {
  project: SharedProject | null;
  mode: SharedProjectDrawerMode;
  onClose: () => void;
  zIndex?: number;

  // Translations
  t?: (key: string, params?: Record<string, unknown>) => string;

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

// --- Utility Components ---

const defaultT = (key: string, params?: Record<string, unknown>): string => {
  const translations: Record<string, string> = {
    "drawer.tabs.overview": "Overview",
    "drawer.tabs.units": "Units",
    "drawer.tabs.construction": "Construction",
    "drawer.tabs.media": "Media",
    "drawer.tabs.partners": "Partners",
    "drawer.tabs.settings": "Settings",
    "drawer.commission.title": "Your commission",
    "drawer.commission.active": "Active",
    "drawer.commission.requiresContract": "Requires contract",
    "drawer.commission.condition": "Payment condition",
    "drawer.commission.signOffer": "Sign the offer with the developer to lock clients and receive commission.",
    "drawer.stats.roi": "ROI",
    "drawer.stats.completion": "Completion",
    "drawer.stats.priceFrom": "Price from",
    "drawer.stats.units": "Units",
    "drawer.about.title": "About project",
    "drawer.about.description": "Modern residential complex in a prestigious area. Ideal for living and investment.",
    "drawer.quickAccess": "Quick access",
    "drawer.media.title": "Project media bank",
    "drawer.media.downloadAll": "Download all (ZIP)",
    "drawer.media.renders": "Renders",
    "drawer.media.videos": "Videos",
    "drawer.media.presentations": "Presentations",
    "drawer.media.noMaterials": "No materials",
    "drawer.media.restricted": "Access restricted",
    "drawer.media.signToAccess": "Sign the contract with the developer to access the media bank.",
    "drawer.media.connect": "Connect",
    "drawer.construction.title": "Construction progress",
    "drawer.construction.noUpdates": "No updates",
    "drawer.units.legend.available": "Available",
    "drawer.units.legend.booked": "Booked",
    "drawer.units.legend.sold": "Sold",
    "drawer.units.downloadPdf": "Download PDF",
    "drawer.actions.lock": "Lock client",
    "drawer.actions.favorite": "Add to collection",
    "drawer.actions.share": "Share",
    "drawer.actions.becomePartner": "Become a partner",
    "drawer.actions.pendingConfirmation": "Pending confirmation",
    "drawer.actions.partnershipUnavailable": "Partnership not available",
    "drawer.actions.openPage": "Open page",
  };

  let result = translations[key] ?? key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v));
    });
  }
  return result;
};

// --- Tab Components ---

const OverviewTab: React.FC<{
  project: SharedProject;
  t: (key: string, params?: Record<string, unknown>) => string;
}> = ({ project, t }) => {
  const isConnected = project.partnershipStatus === "active";

  return (
    <div className="p-6 space-y-6">
      {/* Commission Block */}
      <div
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
      </div>

      {/* Stats Grid */}
   {/*    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase mb-1">{t("drawer.stats.roi")}</div>
          <div className="text-lg font-bold text-blue-600">{project.yield ? `${project.yield}%` : "—"}</div>
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
        <h3 className="text-sm font-bold uppercase text-slate-500 mb-3 tracking-wider">{t("drawer.about.title")}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {project.description ?? '-'}
        </p>
      </div>

      {/* Quick Downloads */}
      {isConnected && project.media?.presentations && project.media.presentations.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-500 mb-3 tracking-wider">{t("drawer.quickAccess")}</h3>
          <a
            href="#"
            className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100">
              <FileText size={18} />
            </div>
            <span className="text-sm font-medium text-slate-700">{project.media.presentations[0]?.title}</span>
            <Download size={16} className="ml-auto text-slate-400 group-hover:text-blue-600" />
          </a>
        </div>
      )}
    </div>
  );
};

/** Sanitize string for use in filename (remove path chars, limit length) */
function safeFilename(name: string, maxLength = 80): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength) || "file";
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
      <div className="p-10 text-center flex flex-col items-center justify-center">
        <Lock size={32} className="text-slate-300 mb-3" />
        <p className="text-slate-500 font-bold">{t("drawer.media.restricted")}</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">{t("drawer.media.signToAccess")}</p>
        {project.partnershipSettings?.allowPartnerConnect === false ? null : (
          <button
            type="button"
            onClick={() => onConnect?.(project)}
            className="text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
          >
            {t("drawer.media.connect")}
          </button>
        )}
      </div>
    );
  }

  if (!media) {
    return <div className="p-10 text-center text-slate-400">{t("drawer.media.noMaterials")}</div>;
  }

  const { renders, videos, presentations } = media;
  const projectName = safeFilename(project.name);

  const handleDownloadAll = () => {
    const items: Array<{ url: string; filename: string }> = [];
    renders?.forEach((url, i) => {
      items.push({ url, filename: `${projectName}-render-${i + 1}${extFromUrl(url, ".jpg")}` });
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
    downloadFile(url, `${projectName}-render-${index + 1}${extFromUrl(url, ".jpg")}`);
  };

  const handleDownloadVideo = (vid: { url: string; title: string }) => {
    downloadFile(
      vid.url,
      `${projectName}-${safeFilename(vid.title)}${extFromUrl(vid.url, ".mp4")}`,
    );
  };

  const handleDownloadPresentation = (doc: { url?: string; title: string }) => {
    if (doc.url) downloadFile(doc.url, `${projectName}-${safeFilename(doc.title)}.pdf`);
  };

  const downloadAllItemCount =
    (renders?.length ?? 0) +
    (videos?.length ?? 0) +
    (presentations?.filter((d) => d.url).length ?? 0);
  const canDownloadAll = downloadAllItemCount > 0;

  return (
    <div className="p-6 space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t("drawer.media.title")}</h4>
        <button
          type="button"
          onClick={handleDownloadAll}
          disabled={!canDownloadAll}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FolderArchive size={16} />
          {t("drawer.media.downloadAll")}
        </button>
      </div>

      {/* Renders */}
      {renders && renders.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <ImageIcon size={14} />
            {t("drawer.media.renders")}
          </h5>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {renders.map((url, i) => (
              <button
                type="button"
                key={`render-${i}`}
                onClick={() => handleDownloadRender(url, i)}
                className="aspect-video rounded-lg overflow-hidden border border-slate-200 relative group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <img
                  src={url}
                  alt={`Render ${i}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
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
          <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <PlayCircle size={14} />
            {t("drawer.media.videos")}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((vid, i) => (
              <button
                type="button"
                key={`video-${i}`}
                onClick={() => handleDownloadVideo(vid)}
                className="aspect-video rounded-lg overflow-hidden border border-slate-200 relative bg-black group cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <img
                  src={vid.thumbnail ?? ""}
                  alt={vid.title}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40">
                    <PlayCircle size={20} fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 text-white text-xs font-bold">{vid.title}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Presentations */}
      {presentations && presentations.length > 0 && (
        <div>
          <h5 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
            <FileText size={14} />
            {t("drawer.media.presentations")}
          </h5>
          <div className="space-y-2">
            {presentations.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                    <FileText size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{doc.title}</div>
                    <div className="text-[10px] text-slate-400">PDF</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadPresentation(doc)}
                  disabled={!doc.url}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
        {t("drawer.construction.title")}
      </h4>
      {updates.length === 0 ? (
        <div className="text-sm text-slate-400 italic">{t("drawer.construction.noUpdates")}</div>
      ) : (
        <div className="relative pl-4 border-l border-slate-200 space-y-8">
          {updates.map((update) => (
            <div key={update.id} className="relative pl-6">
              <div className="absolute -left-[21px] top-1 w-3 h-3 bg-blue-500 rounded-full ring-4 ring-white" />
              <div className="text-xs font-bold text-slate-400 mb-1">
                {new Date(update.date).toLocaleDateString()}
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{update.title}</h4>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed">
                {update.description}
              </p>
              {update.images && update.images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {update.images.slice(0, 3).map((img, i) => (
                    <img
                      key={`img-${i}`}
                      src={img}
                      alt={`Update ${i}`}
                      className="aspect-video object-cover rounded-lg border border-slate-200"
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
  t: externalT,
  onLock,
  onConnect,
  onShare,
  onOpenPublicPage,
  onUpdate: _onUpdate,
  onNavigateToEditor,
  renderUnitsTab,
  renderMediaTab,
  renderConstructionTab,
  renderPartnersTab,
  renderSettingsTab,
  initialTab = "overview",
}) => {
  void _onUpdate; // Reserved for future use
  const t = externalT ?? defaultT;
  const [activeTab, setActiveTab] = useState<SharedProjectDrawerTab>(initialTab);

  if (!project) return null;

  const isConnected = project.partnershipStatus === "active";
  const isPending = project.partnershipStatus === "pending";
  const allowPartnerConnect = project.partnershipSettings?.allowPartnerConnect ?? true;
  const isAgent = mode === "agent" || mode === "catalog";
  const isDeveloper = mode === "developer";

  // Determine available tabs based on mode
  const tabs: Array<{ id: SharedProjectDrawerTab; label: string; icon: React.ReactNode }> = [
    { id: "overview", label: t("drawer.tabs.overview"), icon: <Info size={16} /> },
    { id: "units", label: t("drawer.tabs.units"), icon: <LayoutGrid size={16} /> },
    { id: "media", label: t("drawer.tabs.media"), icon: <ImageIcon size={16} /> },
    { id: "construction", label: t("drawer.tabs.construction"), icon: <Hammer size={16} /> },
  ];

  if (isDeveloper) {
    tabs.push({ id: "partners", label: t("drawer.tabs.partners"), icon: <Handshake size={16} /> });
  }

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
        className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200"
        style={{ zIndex }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-48 bg-slate-100 shrink-0">
          {project.imageUrl ? (
            <div className="absolute inset-0">
              <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
              <Building2 size={64} className="text-white/10" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-300 mt-1">
              <MapPin size={14} />
              {project.location ?? ""}
            </div>
          </div>
          {project.developerName && (
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border border-white/10">
              <Building2 size={12} />
              {project.developerName}
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white rounded-full transition-colors z-20"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === "overview" && <OverviewTab project={project} t={t} />}
          {activeTab === "units" &&
            (renderUnitsTab ? (
              renderUnitsTab(project)
            ) : (
              <div className="p-8 text-center text-slate-400">Units view not implemented</div>
            ))}
          {activeTab === "media" &&
            (renderMediaTab ? (
              renderMediaTab(project)
            ) : (
              <MediaTab project={project} isConnected={isConnected} onConnect={onConnect} t={t} />
            ))}
          {activeTab === "construction" &&
            (renderConstructionTab ? (
              renderConstructionTab(project)
            ) : (
              <ConstructionTab project={project} t={t} />
            ))}
          {activeTab === "partners" &&
            isDeveloper &&
            (renderPartnersTab ? (
              renderPartnersTab(project)
            ) : (
              <div className="p-8 text-center text-slate-400">Partners view not implemented</div>
            ))}
          {activeTab === "settings" &&
            isDeveloper &&
            (renderSettingsTab ? (
              renderSettingsTab(project)
            ) : (
              <div className="p-8 text-center text-slate-400">Settings not implemented</div>
            ))}
        </div>

        {/* Footer */}
        <footer className="p-4 bg-white border-t border-slate-200 flex items-center gap-3 shrink-0">
          {isAgent && (
            <>
              {isConnected ? (
                <button
                  type="button"
                  onClick={() => onLock?.(project)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  <Lock size={16} />
                  {t("drawer.actions.lock")}
                </button>
              ) : isPending ? (
                <div className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                  <Clock size={16} />
                  {t("drawer.actions.pendingConfirmation")}
                </div>
              ) : !allowPartnerConnect ? (
                <div className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                  <Handshake size={16} />
                  {t("drawer.actions.partnershipUnavailable")}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onConnect?.(project)}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Handshake size={16} />
                  {t("drawer.actions.becomePartner")}
                </button>
              )}
              <button
                type="button"
                onClick={() => onShare?.(project)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
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
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={16} />
                {t("drawer.actions.openPage")}
              </button>
              <button
                type="button"
                onClick={() => onNavigateToEditor?.(project.id)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
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
