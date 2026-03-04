import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import {
  Button,
  InteractiveProjectsMap,
  SharedProjectDrawer,
  type SharedProject,
  UnitsChessboard,
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

type UnitStatusGroup = "available" | "booked" | "sold";

function getUnitStatusGroup(status: string | null): UnitStatusGroup {
  const st = String(status ?? "").toLowerCase();
  if (st === "available") return "available";
  if (st === "reserved" || st === "booked") return "booked";
  return "sold";
}

function getMainAppUrl(): string {
  const env = (import.meta as any).env?.VITE_MAIN_APP_URL;
  const raw = typeof env === "string" && env ? env : "https://app.gridix.live";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

export function CatalogTab() {
  const { language, t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected =
    availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  const base = useMemo(() => getMainAppUrl(), []);
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [drawerProject, setDrawerProject] = useState<SharedProject | null>(
    null,
  );

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
      return (
        String(p.name ?? "")
          .toLowerCase()
          .includes(s) ||
        String(p.address ?? "")
          .toLowerCase()
          .includes(s)
      );
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
      ...(p.commission_condition
        ? { payoutCondition: p.commission_condition }
        : {}),
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
        const { data, error } = await supabase.functions.invoke(
          "agent-program",
          {
            body: {
              action: "get_project_drawer",
              application_id: activeWorkspaceId,
              project_id: selectedProject.id,
            },
          },
        );
        if (error) throw error;
        if (cancelled) return;
        if (!(data as any)?.success)
          throw new Error((data as any)?.error ?? "Failed");
        const api = (data as any).project;
        setDrawerProject({
          id: String(api.id),
          name: String(api.name ?? ""),
          location: api.location ?? undefined,
          imageUrl: api.imageUrl ?? undefined,
          description: api.description ?? undefined,
          floors:
            typeof api.floors === "number"
              ? api.floors
              : api.floors
                ? Number(api.floors)
                : undefined,
          minPrice: api.minPrice ?? undefined,
          yield: api.yield ?? undefined,
          stats: api.stats ?? undefined,
          media: api.media ?? undefined,
          constructionProgress: api.constructionProgress ?? undefined,
          partnershipStatus: "active",
          partnershipSettings: api.partnershipSettings ?? undefined,
          commissionPercent:
            api.partnershipSettings?.commissionType === "percent"
              ? Number(api.partnershipSettings?.commissionValue ?? 5)
              : undefined,
          commissionCondition:
            api.partnershipSettings?.payoutCondition ?? undefined,
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
        const { data, error } = await supabase.functions.invoke(
          "agent-program",
          {
            body: {
              action: "list_project_units",
              application_id: activeWorkspaceId,
              project_id: project.id,
            },
          },
        );
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
          price?: number | null;
        }>,
      [payload],
    );

    const openUnit = (apartmentNumber: string | null) => {
      if (!activeWorkspaceId || !slug || !apartmentNumber) return;
      const url = `${base}/${encodeURIComponent(language)}/project/${slug}/apartment/${encodeURIComponent(
        apartmentNumber,
      )}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
      <UnitsChessboard
        units={units}
        loading={unitsQuery.isLoading}
        loadingText={t("common.common.loading")}
        emptyText={t("common.drawer.units.empty")}
        labels={{
          available: t("common.drawer.units.legend.available"),
          booked: t("common.drawer.units.legend.booked"),
          sold: t("common.drawer.units.legend.sold"),
        }}
        onUnitClick={(unit) => openUnit(unit.apartment_number)}
        getUnitStatusGroup={getUnitStatusGroup}
      />
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#F8FAFC]">
      {/* Project Drawer */}
      {selectedProject && (
        <SharedProjectDrawer
          project={drawerProject ?? toSharedProject(selectedProject)}
          mode="agent"
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
            ? t("common.catalog.subtitleWithWorkspace", {
                workspace: selected.label,
              })
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
        <div className="border-b border-slate-200 bg-white px-4 py-3 animate-in slide-in-from-top-2 md:px-6">
          <div className="text-xs text-slate-500">
            {t("common.catalog.filtersPlaceholder")}
          </div>
        </div>
      ) : null}

      <div
        className={`flex-1 overflow-y-auto bg-slate-50 ${viewMode === "grid" ? "p-4 md:p-6" : "p-0"} custom-scrollbar`}
      >
        <div className="h-full">
          {!activeWorkspaceId ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              {t("common.workspace.pickInSidebar")}
            </div>
          ) : projectsQuery.isLoading ? (
            <div className="text-sm text-slate-500">
              {t("common.common.loading")}
            </div>
          ) : (filtered ?? []).length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
              {t("common.catalog.noProjects")}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filtered.map((p) => {
                const shareUrl = shareUrlForProject(p);

                return (
                  <div
                    key={p.id}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg"
                    onClick={() => handleOpenProject(p)}
                  >
                    {p.building_image_url ? (
                      <img
                        src={p.building_image_url}
                        alt={p.name}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <div className="h-44 w-full bg-slate-200" />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="line-clamp-2 font-black leading-tight text-slate-900">
                        {p.name}
                      </div>
                      <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {p.address ?? t("common.common.empty")}
                      </div>
                      <div className="mt-auto pt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProject(p);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
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
                                  window.prompt(
                                    t("common.catalog.clientLinkPrompt"),
                                    shareUrl,
                                  );
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
            <div className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
          )}
        </div>
      </div>
    </div>
  );
}
