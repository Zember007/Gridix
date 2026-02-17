import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import {
  Button,
  InteractiveProjectsMap,
  SharedProjectDrawer,
  type SharedProject,
} from "@gridix/ui";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Share2, Eye } from "lucide-react";

type Project = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  building_image_url: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  floors?: number | null;
  total_units?: number | null;
  available_units?: number | null;
  min_price?: number | null;
  yield_percent?: number | null;
  commission_percent?: number | null;
  commission_condition?: string | null;
  developer_name?: string | null;
  allow_partner_connect?: boolean | null;
};

function getMainAppUrl(): string {
  const env = (import.meta as any).env?.VITE_MAIN_APP_URL;
  const raw = typeof env === "string" && env ? env : "https://app.gridix.live";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function CatalogTab() {
  const { language, t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected = availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  const base = useMemo(() => getMainAppUrl(), []);
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [drawerProject, setDrawerProject] = useState<SharedProject | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["agent_catalog_projects", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_projects", agent_id: activeWorkspaceId },
      });
      if (error) throw error;
      return ((data as any)?.projects ?? []) as Project[];
    },
  });

  const filtered = useMemo(() => {
    const rows = projectsQuery.data ?? [];
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((p) => {
      return String(p.name ?? "").toLowerCase().includes(s) || String(p.address ?? "").toLowerCase().includes(s);
    });
  }, [projectsQuery.data, q]);

  const shareUrlForProject = (p: Project): string | null => {
    if (!p.slug || !activeWorkspaceId) return null;
    // Shareable client URL into main app project page (agent_id keeps attribution).
    return `${base}/${encodeURIComponent(language)}/project/${p.slug}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
  };

  // Convert Project to SharedProject for the drawer
  const toSharedProject = (p: Project): SharedProject => ({
    id: p.id,
    name: p.name,
    location: p.address ?? undefined,
    developerName: p.developer_name ?? undefined,
    imageUrl: p.building_image_url ?? undefined,
    description: p.description ?? undefined,
    floors: p.floors ?? undefined,
    minPrice: p.min_price ?? undefined,
    totalUnits: p.total_units ?? undefined,
    availableUnits: p.available_units ?? undefined,
    yield: p.yield_percent ?? undefined,
    commissionPercent: p.commission_percent ?? undefined,
    commissionCondition: p.commission_condition ?? undefined,
    partnershipStatus: "active",
    partnershipSettings: {
      isEnabled: true,
      allowPartnerConnect: p.allow_partner_connect === false ? false : true,
      commissionType: "percent",
      commissionValue: p.commission_percent ?? 5,
      ...(p.commission_condition ? { payoutCondition: p.commission_condition } : {}),
    },
  });

  const handleOpenProject = (p: Project) => {
    setSelectedProject(p);
    setDrawerProject(toSharedProject(p));
  };

  const handleCloseDrawer = () => {
    setSelectedProject(null);
    setDrawerProject(null);
  };

  const handleShareProject = (p: SharedProject) => {
    const project = (projectsQuery.data ?? []).find((pr) => pr.id === p.id);
    if (!project) return;
    const shareUrl = shareUrlForProject(project);
    if (!shareUrl) return;
    if (navigator.share) {
      void navigator.share({ title: project.name, url: shareUrl });
    } else {
      void navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleOpenPublicPage = (p: SharedProject) => {
    const project = (projectsQuery.data ?? []).find((pr) => pr.id === p.id);
    if (!project) return;
    const shareUrl = shareUrlForProject(project);
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!activeWorkspaceId || !selectedProject) return;
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("agent-program", {
          body: { action: "get_project_drawer", application_id: activeWorkspaceId, project_id: selectedProject.id },
        });
        if (error) throw error;
        if (cancelled) return;
        if (!(data as any)?.success) throw new Error((data as any)?.error ?? "Failed");
        const api = (data as any).project;
        setDrawerProject({
          id: String(api.id),
          name: String(api.name ?? ""),
          location: api.location ?? undefined,
          imageUrl: api.imageUrl ?? undefined,
          description: api.description ?? undefined,
          floors: typeof api.floors === "number" ? api.floors : api.floors ? Number(api.floors) : undefined,
          minPrice: api.minPrice ?? undefined,
          yield: api.yield ?? undefined,
          stats: api.stats ?? undefined,
          media: api.media ?? undefined,
          constructionProgress: api.constructionProgress ?? undefined,
          partnershipStatus: "active",
          partnershipSettings: api.partnershipSettings ?? undefined,
          commissionPercent:
            api.partnershipSettings?.commissionType === "percent" ? Number(api.partnershipSettings?.commissionValue ?? 5) : undefined,
          commissionCondition: api.partnershipSettings?.payoutCondition ?? undefined,
        });
      } catch (e) {
        console.error("Failed to load project drawer", e);
      } finally {
        // no-op
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, selectedProject]);

  const AgentUnitsTab = ({ project }: { project: SharedProject }) => {
    const unitsQuery = useQuery({
      queryKey: ["agent_project_units", activeWorkspaceId, project.id],
      enabled: !!activeWorkspaceId && !!project.id,
      queryFn: async () => {
        const { data, error } = await supabase.functions.invoke("agent-program", {
          body: { action: "list_project_units", application_id: activeWorkspaceId, project_id: project.id },
        });
        if (error) throw error;
        return data as any;
      },
    });

    const payload = unitsQuery.data as any;
    const slug = payload?.project?.slug ?? null;
    const units = useMemo(
      () =>
        (payload?.units ?? []) as Array<{
          id: string;
          apartment_number: string | null;
          floor_number: number;
          status: string | null;
        }>,
      [payload],
    );

    const floors = useMemo(() => {
      const set = new Set<number>();
      for (const u of units) set.add(u.floor_number);
      return Array.from(set).sort((a, b) => b - a);
    }, [units]);

    const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
    useEffect(() => {
      if (selectedFloor !== null) return;
      setSelectedFloor(floors[0] ?? null);
    }, [floors, selectedFloor]);

    const floorUnits = useMemo(() => {
      if (selectedFloor === null) return [];
      return units
        .filter((u) => u.floor_number === selectedFloor)
        .slice()
        .sort((a, b) => String(a.apartment_number ?? "").localeCompare(String(b.apartment_number ?? ""), undefined, { numeric: true }));
    }, [units, selectedFloor]);

    const openUnit = (apartmentNumber: string | null) => {
      if (!activeWorkspaceId || !slug || !apartmentNumber) return;
      const url = `${base}/${encodeURIComponent(language)}/project/${slug}/apartment/${encodeURIComponent(
        apartmentNumber,
      )}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    if (unitsQuery.isLoading) {
      return <div className="p-6 text-sm text-slate-500">{t("common.common.loading")}</div>;
    }
    if (!unitsQuery.data || units.length === 0) {
      return <div className="p-6 text-sm text-slate-500">Нет объектов</div>;
    }

    return (
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
          <div className="rounded-lg border bg-white p-2">
            <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">Этаж</div>
            <div className="max-h-[420px] overflow-auto">
              {floors.map((f) => {
                const count = units.filter((u) => u.floor_number === f).length;
                const isActive = f === selectedFloor;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSelectedFloor(f)}
                    className={[
                      "w-full rounded-md px-3 py-2 text-left text-sm transition",
                      isActive ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between">
                      <span>Этаж {f}</span>
                      <span className={isActive ? "text-white/70" : "text-slate-400"}>{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border bg-white p-3">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
              }}
            >
              {floorUnits.map((u) => {
                const st = String(u.status ?? "");
                const isAvailable = st === "available";
                const isBooked = st === "reserved" || st === "booked";
                const isSold = st === "sold";
                const statusColor = isAvailable
                  ? "border-emerald-300 bg-emerald-50 hover:bg-emerald-100"
                  : isBooked
                    ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                    : isSold
                      ? "border-slate-200 bg-slate-50"
                      : "border-slate-200 bg-slate-50 opacity-60";

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => openUnit(u.apartment_number)}
                    className={["rounded-lg border px-2 py-3 text-left transition", statusColor].join(" ")}
                    title={u.apartment_number ? `№${u.apartment_number}` : "—"}
                  >
                    <div className="text-sm font-black leading-none">№{u.apartment_number ?? "—"}</div>
                    <div className="mt-1 text-[11px] text-slate-500">этаж {u.floor_number}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]">
      {/* Project Drawer */}
      {selectedProject && (
        <SharedProjectDrawer
          project={drawerProject ?? toSharedProject(selectedProject)}
          mode="agent"
         /*  onLock={(project) => {}} */
          onClose={handleCloseDrawer}
          onShare={handleShareProject}
          onOpenPublicPage={handleOpenPublicPage}
          renderUnitsTab={(p) => <AgentUnitsTab project={p} />}
        />
      )}

      <ModuleHeader
        title={t("common.catalog.title")}
        subtitle={
          selected
            ? t("common.catalog.subtitleWithWorkspace", { workspace: selected.label })
            : t("common.catalog.subtitle")
        }
        searchValue={q}
        onSearchChange={setQ}
        searchPlaceholder={t("common.catalog.searchPlaceholder")}
        onFilterClick={() => setShowFilters(!showFilters)}
        activeFiltersCount={q.trim() ? 1 : 0}
        viewMode={viewMode}
        onViewModeChange={(m) => setViewMode(m as "grid" | "map")}
        availableViews={["grid", "map"]}
      />

      {showFilters && viewMode !== "map" ? (
        <div className="px-4 md:px-6 py-3 bg-white border-b border-slate-200 animate-in slide-in-from-top-2">
          <div className="text-xs text-slate-500">
            {t("common.catalog.filtersPlaceholder")}
          </div>
        </div>
      ) : null}

      <div className={`flex-1 overflow-y-auto bg-slate-50 ${viewMode === "grid" ? "p-4 md:p-6" : "p-0"} custom-scrollbar`}>
        <div className="h-full">
          {!activeWorkspaceId ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-sm text-slate-600">
              {t("common.workspace.pickInSidebar")}
            </div>
          ) : projectsQuery.isLoading ? (
            <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
          ) : (filtered ?? []).length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-sm text-slate-600">
              {t("common.catalog.noProjects")}
            </div>
          ) : (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                {filtered.map((p) => {
                  const shareUrl = shareUrlForProject(p);

                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 group cursor-pointer flex flex-col"
                      onClick={() => handleOpenProject(p)}
                    >
                      {p.building_image_url ? (
                        <img src={p.building_image_url} alt={p.name} className="h-44 w-full object-cover" />
                      ) : (
                        <div className="h-44 w-full bg-slate-200" />
                      )}
                      <div className="p-5 flex flex-1 flex-col">
                        <div className="font-black text-slate-900 leading-tight line-clamp-2">{p.name}</div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2">{p.address ?? t("common.common.empty")}</div>
                        <div className="mt-auto pt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenProject(p);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {t("common.catalog.details")}
                            </Button>

                            <Button
                              variant="outline"
                              size="icon"
                              disabled={!shareUrl}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!shareUrl) return;
                                if (navigator.share) {
                                  try {
                                    await navigator.share({
                                      title: p.name,
                                      url: shareUrl,
                                    });
                                  } catch (err) {
                                    console.error("Share failed", err);
                                  }
                                } else {
                                  try {
                                    await navigator.clipboard.writeText(shareUrl);
                                  } catch {
                                    window.prompt(t("common.catalog.clientLinkPrompt"), shareUrl);
                                  }
                                }
                              }}
                              title={t("common.catalog.share")}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm">
                <InteractiveProjectsMap
                  projects={(filtered ?? []) as any[]}
                  onOpenProject={(p) => {
                    const shareUrl = shareUrlForProject(p as any);
                    const url = shareUrl;
                    if (!url) return;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
