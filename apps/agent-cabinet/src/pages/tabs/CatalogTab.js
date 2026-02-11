import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import { Button, InteractiveProjectsMap, SharedProjectDrawer, } from "@gridix/ui";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import { Share2, Eye } from "lucide-react";
function getMainAppUrl() {
    const env = import.meta.env?.VITE_MAIN_APP_URL;
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
            if (error)
                throw error;
            return (data?.projects ?? []);
        },
    });
    const filtered = useMemo(() => {
        const rows = projectsQuery.data ?? [];
        const s = q.trim().toLowerCase();
        if (!s)
            return rows;
        return rows.filter((p) => {
            return String(p.name ?? "").toLowerCase().includes(s) || String(p.address ?? "").toLowerCase().includes(s);
        });
    }, [projectsQuery.data, q]);
    const shareUrlForProject = (p) => {
        if (!p.slug || !activeWorkspaceId)
            return null;
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
            ...(p.commission_condition ? { payoutCondition: p.commission_condition } : {}),
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
        if (!project)
            return;
        const shareUrl = shareUrlForProject(project);
        if (!shareUrl)
            return;
        if (navigator.share) {
            void navigator.share({ title: project.name, url: shareUrl });
        }
        else {
            void navigator.clipboard.writeText(shareUrl);
        }
    };
    const handleOpenPublicPage = (p) => {
        const project = (projectsQuery.data ?? []).find((pr) => pr.id === p.id);
        if (!project)
            return;
        const shareUrl = shareUrlForProject(project);
        if (!shareUrl)
            return;
        window.open(shareUrl, "_blank", "noopener,noreferrer");
    };
    useEffect(() => {
        if (!activeWorkspaceId || !selectedProject)
            return;
        let cancelled = false;
        void (async () => {
            try {
                const { data, error } = await supabase.functions.invoke("agent-program", {
                    body: { action: "get_project_drawer", application_id: activeWorkspaceId, project_id: selectedProject.id },
                });
                if (error)
                    throw error;
                if (cancelled)
                    return;
                if (!data?.success)
                    throw new Error(data?.error ?? "Failed");
                const api = data.project;
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
                    commissionPercent: api.partnershipSettings?.commissionType === "percent" ? Number(api.partnershipSettings?.commissionValue ?? 5) : undefined,
                    commissionCondition: api.partnershipSettings?.payoutCondition ?? undefined,
                });
            }
            catch (e) {
                console.error("Failed to load project drawer", e);
            }
            finally {
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
                const { data, error } = await supabase.functions.invoke("agent-program", {
                    body: { action: "list_project_units", application_id: activeWorkspaceId, project_id: project.id },
                });
                if (error)
                    throw error;
                return data;
            },
        });
        const payload = unitsQuery.data;
        const slug = payload?.project?.slug ?? null;
        const units = useMemo(() => (payload?.units ?? []), [payload]);
        const floors = useMemo(() => {
            const set = new Set();
            for (const u of units)
                set.add(u.floor_number);
            return Array.from(set).sort((a, b) => b - a);
        }, [units]);
        const [selectedFloor, setSelectedFloor] = useState(null);
        useEffect(() => {
            if (selectedFloor !== null)
                return;
            setSelectedFloor(floors[0] ?? null);
        }, [floors, selectedFloor]);
        const floorUnits = useMemo(() => {
            if (selectedFloor === null)
                return [];
            return units
                .filter((u) => u.floor_number === selectedFloor)
                .slice()
                .sort((a, b) => String(a.apartment_number ?? "").localeCompare(String(b.apartment_number ?? ""), undefined, { numeric: true }));
        }, [units, selectedFloor]);
        const openUnit = (apartmentNumber) => {
            if (!activeWorkspaceId || !slug || !apartmentNumber)
                return;
            const url = `${base}/${encodeURIComponent(language)}/project/${slug}/apartment/${encodeURIComponent(apartmentNumber)}?agent_id=${encodeURIComponent(activeWorkspaceId)}`;
            window.open(url, "_blank", "noopener,noreferrer");
        };
        if (unitsQuery.isLoading) {
            return _jsx("div", { className: "p-6 text-sm text-slate-500", children: t("common.common.loading") });
        }
        if (!unitsQuery.data || units.length === 0) {
            return _jsx("div", { className: "p-6 text-sm text-slate-500", children: "\u041D\u0435\u0442 \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432" });
        }
        return (_jsx("div", { className: "p-6", children: _jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]", children: [_jsxs("div", { className: "rounded-lg border bg-white p-2", children: [_jsx("div", { className: "px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider", children: "\u042D\u0442\u0430\u0436" }), _jsx("div", { className: "max-h-[420px] overflow-auto", children: floors.map((f) => {
                                    const count = units.filter((u) => u.floor_number === f).length;
                                    const isActive = f === selectedFloor;
                                    return (_jsx("button", { type: "button", onClick: () => setSelectedFloor(f), className: [
                                            "w-full rounded-md px-3 py-2 text-left text-sm transition",
                                            isActive ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700",
                                        ].join(" "), children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { children: ["\u042D\u0442\u0430\u0436 ", f] }), _jsx("span", { className: isActive ? "text-white/70" : "text-slate-400", children: count })] }) }, f));
                                }) })] }), _jsx("div", { className: "rounded-lg border bg-white p-3", children: _jsx("div", { className: "grid gap-2", style: {
                                gridTemplateColumns: "repeat(auto-fill, minmax(76px, 1fr))",
                            }, children: floorUnits.map((u) => {
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
                                return (_jsxs("button", { type: "button", onClick: () => openUnit(u.apartment_number), className: ["rounded-lg border px-2 py-3 text-left transition", statusColor].join(" "), title: u.apartment_number ? `№${u.apartment_number}` : "—", children: [_jsxs("div", { className: "text-sm font-black leading-none", children: ["\u2116", u.apartment_number ?? "—"] }), _jsxs("div", { className: "mt-1 text-[11px] text-slate-500", children: ["\u044D\u0442\u0430\u0436 ", u.floor_number] })] }, u.id));
                            }) }) })] }) }));
    };
    return (_jsxs("div", { className: "flex flex-col h-full overflow-hidden bg-[#F8FAFC]", children: [selectedProject && (_jsx(SharedProjectDrawer, { project: drawerProject ?? toSharedProject(selectedProject), mode: "agent", 
                /*  onLock={(project) => {}} */
                onClose: handleCloseDrawer, onShare: handleShareProject, onOpenPublicPage: handleOpenPublicPage, renderUnitsTab: (p) => _jsx(AgentUnitsTab, { project: p }) })), _jsx(ModuleHeader, { title: t("common.catalog.title"), subtitle: selected
                    ? t("common.catalog.subtitleWithWorkspace", { workspace: selected.label })
                    : t("common.catalog.subtitle"), searchValue: q, onSearchChange: setQ, searchPlaceholder: t("common.catalog.searchPlaceholder"), onFilterClick: () => setShowFilters(!showFilters), activeFiltersCount: q.trim() ? 1 : 0, viewMode: viewMode, onViewModeChange: (m) => setViewMode(m), availableViews: ["grid", "map"] }), showFilters && viewMode !== "map" ? (_jsx("div", { className: "px-4 md:px-6 py-3 bg-white border-b border-slate-200 animate-in slide-in-from-top-2", children: _jsx("div", { className: "text-xs text-slate-500", children: t("common.catalog.filtersPlaceholder") }) })) : null, _jsx("div", { className: `flex-1 overflow-y-auto bg-slate-50 ${viewMode === "grid" ? "p-4 md:p-6" : "p-0"} custom-scrollbar`, children: _jsx("div", { className: "pb-20 h-full", children: !activeWorkspaceId ? (_jsx("div", { className: "bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-sm text-slate-600", children: t("common.workspace.pickInSidebar") })) : projectsQuery.isLoading ? (_jsx("div", { className: "text-sm text-slate-500", children: t("common.common.loading") })) : (filtered ?? []).length === 0 ? (_jsx("div", { className: "bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-sm text-slate-600", children: t("common.catalog.noProjects") })) : (viewMode === "grid" ? (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: filtered.map((p) => {
                            const shareUrl = shareUrlForProject(p);
                            return (_jsxs("div", { className: "bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-lg hover:border-slate-300/80 transition-all duration-300 group cursor-pointer", onClick: () => handleOpenProject(p), children: [p.building_image_url ? (_jsx("img", { src: p.building_image_url, alt: p.name, className: "h-44 w-full object-cover" })) : (_jsx("div", { className: "h-44 w-full bg-slate-200" })), _jsxs("div", { className: "p-5", children: [_jsx("div", { className: "font-black text-slate-900 leading-tight line-clamp-2", children: p.name }), _jsx("div", { className: "text-xs text-slate-500 mt-1 line-clamp-2", children: p.address ?? t("common.common.empty") }), _jsx("div", { className: "mt-4", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { className: "flex-1", onClick: (e) => {
                                                                e.stopPropagation();
                                                                handleOpenProject(p);
                                                            }, children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), t("common.catalog.details")] }), _jsx(Button, { variant: "outline", size: "icon", disabled: !shareUrl, onClick: async (e) => {
                                                                e.stopPropagation();
                                                                if (!shareUrl)
                                                                    return;
                                                                if (navigator.share) {
                                                                    try {
                                                                        await navigator.share({
                                                                            title: p.name,
                                                                            url: shareUrl,
                                                                        });
                                                                    }
                                                                    catch (err) {
                                                                        console.error("Share failed", err);
                                                                    }
                                                                }
                                                                else {
                                                                    try {
                                                                        await navigator.clipboard.writeText(shareUrl);
                                                                    }
                                                                    catch {
                                                                        window.prompt(t("common.catalog.clientLinkPrompt"), shareUrl);
                                                                    }
                                                                }
                                                            }, title: t("common.catalog.share"), children: _jsx(Share2, { className: "h-4 w-4" }) })] }) })] })] }, p.id));
                        }) })) : (_jsx("div", { className: "h-full rounded-xl overflow-hidden bg-white border border-slate-200 shadow-sm", children: _jsx(InteractiveProjectsMap, { projects: (filtered ?? []), onOpenProject: (p) => {
                                const shareUrl = shareUrlForProject(p);
                                const url = shareUrl;
                                if (!url)
                                    return;
                                window.open(url, "_blank", "noopener,noreferrer");
                            } }) }))) }) })] }));
}
