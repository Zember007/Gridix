import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import {
  Button,
  InteractiveProjectsMap,
  SharedProjectDrawer,
} from "@gridix/ui";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Share2, Eye } from "lucide-react";
function getUnitStatusGroup(status) {
  const st = String(status ?? "").toLowerCase();
  if (st === "available") return "available";
  if (st === "reserved" || st === "booked") return "booked";
  return "sold";
}
function getMainAppUrl() {
  const env = import.meta.env?.VITE_MAIN_APP_URL;
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
  const [viewMode, setViewMode] = useState("grid");
  const [selectedProject, setSelectedProject] = useState(null);
  const [drawerProject, setDrawerProject] = useState(null);
  const projectsQuery = useQuery({
    queryKey: ["agent_catalog_projects", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "list_projects", agent_id: activeWorkspaceId },
      });
      if (error) throw error;
      return data?.projects ?? [];
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
  const shareUrlForProject = (p) => {
    if (!p.slug || !activeWorkspaceId) return null;
    // Shareable client URL into main app project page (agent_id keeps attribution).
    return `${base}/${encodeURIComponent(language)}/project/${p.slug}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
  };
  // Convert Project to SharedProject for the drawer
  const toSharedProject = (p) => ({
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
  const handleOpenProject = (p) => {
    setSelectedProject(p);
    setDrawerProject(toSharedProject(p));
  };
  const handleCloseDrawer = () => {
    setSelectedProject(null);
    setDrawerProject(null);
  };
  const handleShareProject = (p) => {
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
  const handleOpenPublicPage = (p) => {
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
        if (!data?.success) throw new Error(data?.error ?? "Failed");
        const api = data.project;
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
  const AgentUnitsTab = ({ project }) => {
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
        return data;
      },
    });
    const payload = unitsQuery.data;
    const slug = payload?.project?.slug ?? null;
    const units = useMemo(() => payload?.units ?? [], [payload]);
    const floors = useMemo(() => {
      const set = new Set();
      for (const u of units) set.add(u.floor_number);
      return Array.from(set).sort((a, b) => b - a);
    }, [units]);
    const unitsByFloor = useMemo(() => {
      const byFloor = new Map();
      for (const u of units) {
        const list = byFloor.get(u.floor_number) ?? [];
        list.push(u);
        byFloor.set(u.floor_number, list);
      }
      for (const list of byFloor.values()) {
        list.sort((a, b) =>
          String(a.apartment_number ?? "").localeCompare(
            String(b.apartment_number ?? ""),
            undefined,
            { numeric: true },
          ),
        );
      }
      return byFloor;
    }, [units]);
    const statusStats = useMemo(() => {
      const stats = { available: 0, booked: 0, sold: 0 };
      for (const u of units) {
        stats[getUnitStatusGroup(u.status)] += 1;
      }
      return stats;
    }, [units]);
    const openUnit = (apartmentNumber) => {
      if (!activeWorkspaceId || !slug || !apartmentNumber) return;
      const url = `${base}/${encodeURIComponent(language)}/project/${slug}/apartment/${encodeURIComponent(apartmentNumber)}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    };
    const formatUnitPrice = (price) => {
      if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
        return "—";
      }
      if (price >= 1000) {
        return `$${Math.round(price / 1000)}K`;
      }
      return `$${Math.round(price)}`;
    };
    if (unitsQuery.isLoading) {
      return _jsx("div", {
        className: "p-6 text-sm text-slate-500",
        children: t("common.common.loading"),
      });
    }
    if (!unitsQuery.data || units.length === 0) {
      return _jsx("div", {
        className: "p-6 text-sm text-slate-500",
        children: t("common.drawer.units.empty"),
      });
    }
    return _jsx("div", {
      className: "p-6",
      children: _jsxs("div", {
        className: "rounded-xl border border-slate-200 bg-white",
        children: [
          _jsxs("div", {
            className:
              "flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-100 px-4 py-3 text-xs font-semibold text-slate-600",
            children: [
              _jsxs("div", {
                className: "inline-flex items-center gap-2",
                children: [
                  _jsx("span", {
                    className: "h-2.5 w-2.5 rounded-full bg-emerald-400",
                  }),
                  _jsxs("span", {
                    children: [
                      t("common.drawer.units.legend.available"),
                      " (",
                      statusStats.available,
                      ")",
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "inline-flex items-center gap-2",
                children: [
                  _jsx("span", {
                    className: "h-2.5 w-2.5 rounded-full bg-amber-400",
                  }),
                  _jsxs("span", {
                    children: [
                      t("common.drawer.units.legend.booked"),
                      " (",
                      statusStats.booked,
                      ")",
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                className: "inline-flex items-center gap-2",
                children: [
                  _jsx("span", {
                    className: "h-2.5 w-2.5 rounded-full bg-slate-300",
                  }),
                  _jsxs("span", {
                    children: [
                      t("common.drawer.units.legend.sold"),
                      " (",
                      statusStats.sold,
                      ")",
                    ],
                  }),
                ],
              }),
            ],
          }),
          _jsx("div", {
            className: "p-3 md:p-4",
            children: _jsx("div", {
              className: "flex flex-col gap-2",
              children: floors.map((f) => {
                const floorUnits = unitsByFloor.get(f) ?? [];
                return _jsxs(
                  "div",
                  {
                    className:
                      "flex items-center gap-3 rounded-md px-1 py-0.5 hover:bg-slate-50",
                    children: [
                      _jsx("div", {
                        className:
                          "w-7 shrink-0 text-right text-sm font-medium text-slate-400",
                        children: f,
                      }),
                      _jsx("div", {
                        className: "flex flex-1 flex-wrap items-center gap-1.5",
                        children: floorUnits.map((u) => {
                          const status = getUnitStatusGroup(u.status);
                          const statusColor =
                            status === "available"
                              ? "border-emerald-400 bg-emerald-400 text-white hover:brightness-95"
                              : status === "booked"
                                ? "border-amber-400 bg-amber-400 text-white hover:brightness-95"
                                : "border-slate-300 bg-slate-300 text-white hover:brightness-95";
                          return _jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => openUnit(u.apartment_number),
                              className: [
                                "flex h-12 w-[62px] shrink-0 flex-col items-center justify-center rounded-md border px-1 text-center transition-colors",
                                statusColor,
                              ].join(" "),
                              title: u.apartment_number ?? "—",
                              children: [
                                _jsx("span", {
                                  className:
                                    "truncate text-[13px] font-semibold leading-none",
                                  children: u.apartment_number ?? "—",
                                }),
                                _jsx("span", {
                                  className:
                                    "mt-0.5 truncate text-[9px] font-semibold leading-none text-white",
                                  children:
                                    status === "sold"
                                      ? t("common.drawer.units.legend.sold")
                                      : status === "booked"
                                        ? t("common.drawer.units.legend.booked")
                                        : formatUnitPrice(u.price),
                                }),
                              ],
                            },
                            u.id,
                          );
                        }),
                      }),
                    ],
                  },
                  f,
                );
              }),
            }),
          }),
        ],
      }),
    });
  };
  return _jsxs("div", {
    className: "flex h-full flex-col overflow-hidden bg-[#F8FAFC]",
    children: [
      selectedProject &&
        _jsx(SharedProjectDrawer, {
          project: drawerProject ?? toSharedProject(selectedProject),
          mode: "agent",
          onClose: handleCloseDrawer,
          onShare: handleShareProject,
          onOpenPublicPage: handleOpenPublicPage,
          renderUnitsTab: (p) => _jsx(AgentUnitsTab, { project: p }),
        }),
      _jsx(ModuleHeader, {
        title: t("common.catalog.title"),
        subtitle: selected
          ? t("common.catalog.subtitleWithWorkspace", {
              workspace: selected.label,
            })
          : t("common.catalog.subtitle"),
        searchValue: q,
        onSearchChange: setQ,
        searchPlaceholder: t("common.catalog.searchPlaceholder"),
        onFilterClick: () => setShowFilters(!showFilters),
        activeFiltersCount: q.trim() ? 1 : 0,
        viewMode: viewMode,
        onViewModeChange: (m) => setViewMode(m),
        availableViews: ["grid", "map"],
      }),
      showFilters && viewMode !== "map"
        ? _jsx("div", {
            className:
              "border-b border-slate-200 bg-white px-4 py-3 animate-in slide-in-from-top-2 md:px-6",
            children: _jsx("div", {
              className: "text-xs text-slate-500",
              children: t("common.catalog.filtersPlaceholder"),
            }),
          })
        : null,
      _jsx("div", {
        className: `flex-1 overflow-y-auto bg-slate-50 ${viewMode === "grid" ? "p-4 md:p-6" : "p-0"} custom-scrollbar`,
        children: _jsx("div", {
          className: "h-full",
          children: !activeWorkspaceId
            ? _jsx("div", {
                className:
                  "rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm",
                children: t("common.workspace.pickInSidebar"),
              })
            : projectsQuery.isLoading
              ? _jsx("div", {
                  className: "text-sm text-slate-500",
                  children: t("common.common.loading"),
                })
              : (filtered ?? []).length === 0
                ? _jsx("div", {
                    className:
                      "rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm",
                    children: t("common.catalog.noProjects"),
                  })
                : viewMode === "grid"
                  ? _jsx("div", {
                      className:
                        "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
                      children: filtered.map((p) => {
                        const shareUrl = shareUrlForProject(p);
                        return _jsxs(
                          "div",
                          {
                            className:
                              "group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg",
                            onClick: () => handleOpenProject(p),
                            children: [
                              p.building_image_url
                                ? _jsx("img", {
                                    src: p.building_image_url,
                                    alt: p.name,
                                    className: "h-44 w-full object-cover",
                                  })
                                : _jsx("div", {
                                    className: "h-44 w-full bg-slate-200",
                                  }),
                              _jsxs("div", {
                                className: "flex flex-1 flex-col p-5",
                                children: [
                                  _jsx("div", {
                                    className:
                                      "line-clamp-2 font-black leading-tight text-slate-900",
                                    children: p.name,
                                  }),
                                  _jsx("div", {
                                    className:
                                      "mt-1 line-clamp-2 text-xs text-slate-500",
                                    children:
                                      p.address ?? t("common.common.empty"),
                                  }),
                                  _jsx("div", {
                                    className: "mt-auto pt-4",
                                    children: _jsxs("div", {
                                      className: "flex items-center gap-2",
                                      children: [
                                        _jsxs(Button, {
                                          className: "flex-1",
                                          onClick: (e) => {
                                            e.stopPropagation();
                                            handleOpenProject(p);
                                          },
                                          children: [
                                            _jsx(Eye, {
                                              className: "mr-2 h-4 w-4",
                                            }),
                                            t("common.catalog.details"),
                                          ],
                                        }),
                                        _jsx(Button, {
                                          variant: "outline",
                                          size: "icon",
                                          disabled: !shareUrl,
                                          onClick: async (e) => {
                                            e.stopPropagation();
                                            if (!shareUrl) return;
                                            if (navigator.share) {
                                              try {
                                                await navigator.share({
                                                  title: p.name,
                                                  url: shareUrl,
                                                });
                                              } catch (err) {
                                                console.error(
                                                  "Share failed",
                                                  err,
                                                );
                                              }
                                            } else {
                                              try {
                                                await navigator.clipboard.writeText(
                                                  shareUrl,
                                                );
                                              } catch {
                                                window.prompt(
                                                  t(
                                                    "common.catalog.clientLinkPrompt",
                                                  ),
                                                  shareUrl,
                                                );
                                              }
                                            }
                                          },
                                          title: t("common.catalog.share"),
                                          children: _jsx(Share2, {
                                            className: "h-4 w-4",
                                          }),
                                        }),
                                      ],
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          },
                          p.id,
                        );
                      }),
                    })
                  : _jsx("div", {
                      className:
                        "h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
                      children: _jsx(InteractiveProjectsMap, {
                        projects: filtered ?? [],
                        onOpenProject: (p) => {
                          const shareUrl = shareUrlForProject(p);
                          const url = shareUrl;
                          if (!url) return;
                          window.open(url, "_blank", "noopener,noreferrer");
                        },
                      }),
                    }),
        }),
      }),
    ],
  });
}
