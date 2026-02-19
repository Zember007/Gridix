import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Handshake,
  Lock,
  Wallet,
  Activity,
  Zap,
  Layers,
} from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";
const MetricCard = ({
  title,
  value,
  trend,
  trendUp = true,
  icon,
  color,
  chartData,
  subtext,
}) => {
  // Sparkline Logic
  const sparklinePath = useMemo(() => {
    if (!chartData || chartData.length === 0) return "";
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min || 1;
    const width = 100;
    const height = 30;
    return chartData
      .map((val, i) => {
        const x = (i / (chartData.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [chartData]);
  const bgColors = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return _jsxs("div", {
    className:
      "group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg",
    children: [
      _jsxs("div", {
        className: "relative z-10 mb-3 flex items-start justify-between",
        children: [
          _jsx("div", {
            className: `rounded-xl p-2.5 transition-transform group-hover:scale-110 ${bgColors[color] ?? bgColors.blue}`,
            children: icon,
          }),
          trend
            ? _jsxs("div", {
                className: `flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`,
                children: [
                  trendUp
                    ? _jsx(ArrowUpRight, { size: 12 })
                    : _jsx(ArrowDownRight, { size: 12 }),
                  trend,
                ],
              })
            : null,
        ],
      }),
      _jsxs("div", {
        className: "relative z-10",
        children: [
          _jsx("p", {
            className:
              "mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400",
            children: title,
          }),
          _jsx("h3", {
            className: "text-2xl font-black tracking-tight text-slate-900",
            children: value,
          }),
          subtext
            ? _jsx("p", {
                className: "mt-1 text-[10px] font-medium text-slate-400",
                children: subtext,
              })
            : null,
        ],
      }),
      chartData &&
        chartData.length > 1 &&
        _jsx("div", {
          className:
            "absolute bottom-4 right-4 h-8 w-24 opacity-20 transition-opacity group-hover:opacity-50",
          children: _jsx("svg", {
            width: "100%",
            height: "100%",
            viewBox: "0 0 100 30",
            preserveAspectRatio: "none",
            className: "overflow-visible",
            children: _jsx("polyline", {
              points: sparklinePath,
              fill: "none",
              stroke: trendUp ? "#10b981" : "#ef4444",
              strokeWidth: "2.5",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
          }),
        }),
    ],
  });
};
// Revenue Chart Component
const RevenueChart = ({ data, t }) => {
  const generatePath = (points, width, height) => {
    if (points.length === 0) return "";
    const max = Math.max(...points) * 1.1 || 1;
    const coords = points.map((val, i) => ({
      x: (i / Math.max(points.length - 1, 1)) * width,
      y: height - (val / max) * height,
    }));
    const firstCoord = coords[0];
    if (!firstCoord) return "";
    let d = `M ${firstCoord.x},${firstCoord.y}`;
    for (let i = 1; i < coords.length; i++) {
      const curr = coords[i];
      const prev = coords[i - 1];
      if (!curr || !prev) continue;
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    return d;
  };
  const path = generatePath(data, 800, 250);
  const area = path ? `${path} L 800,250 L 0,250 Z` : "";
  return _jsxs("div", {
    className:
      "relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm",
    children: [
      _jsxs("div", {
        className: "z-10 mb-6 flex items-center justify-between",
        children: [
          _jsxs("div", {
            children: [
              _jsx("h3", {
                className: "text-base font-bold text-slate-900",
                children: t("common.dashboard.chart.title"),
              }),
              _jsx("p", {
                className: "mt-1 text-xs text-slate-500",
                children: t("common.dashboard.chart.subtitle"),
              }),
            ],
          }),
          _jsx("div", {
            className: "rounded-lg border border-slate-100 bg-slate-50 p-1",
            children: _jsx("button", {
              type: "button",
              className:
                "rounded bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-sm",
              children: "2025",
            }),
          }),
        ],
      }),
      _jsx("div", {
        className: "relative min-h-[200px] w-full flex-1",
        children: _jsxs("svg", {
          viewBox: "0 0 800 250",
          className: "h-full w-full overflow-visible",
          preserveAspectRatio: "none",
          children: [
            _jsx("defs", {
              children: _jsxs("linearGradient", {
                id: "revGradient",
                x1: "0",
                y1: "0",
                x2: "0",
                y2: "1",
                children: [
                  _jsx("stop", {
                    offset: "0%",
                    stopColor: "#10b981",
                    stopOpacity: "0.2",
                  }),
                  _jsx("stop", {
                    offset: "100%",
                    stopColor: "#10b981",
                    stopOpacity: "0",
                  }),
                ],
              }),
            }),
            [0, 50, 100, 150, 200].map((y) =>
              _jsx(
                "line",
                {
                  x1: "0",
                  y1: y,
                  x2: "800",
                  y2: y,
                  stroke: "#f1f5f9",
                  strokeDasharray: "4 4",
                },
                y,
              ),
            ),
            _jsx("path", { d: area, fill: "url(#revGradient)" }),
            _jsx("path", {
              d: path,
              fill: "none",
              stroke: "#10b981",
              strokeWidth: "3",
              strokeLinecap: "round",
              vectorEffect: "non-scaling-stroke",
            }),
          ],
        }),
      }),
      _jsx("div", {
        className:
          "mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400",
        children: ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) =>
          _jsx("span", { children: m }, m),
        ),
      }),
    ],
  });
};
const LiveActivityFeed = ({ activities, t }) => {
  return _jsxs("div", {
    className:
      "flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm",
    children: [
      _jsxs("div", {
        className:
          "sticky top-0 z-10 flex items-center justify-between border-b border-slate-50 bg-slate-50/30 p-6 backdrop-blur-sm",
        children: [
          _jsxs("h3", {
            className:
              "flex items-center gap-2 text-sm font-bold text-slate-900",
            children: [
              _jsx(Activity, { size: 18, className: "text-blue-500" }),
              t("common.dashboard.activity.title"),
            ],
          }),
          _jsx("div", {
            className:
              "flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1",
            children: _jsx("span", {
              className: "text-[10px] font-bold uppercase text-blue-700",
              children: "Live",
            }),
          }),
        ],
      }),
      _jsx("div", {
        className: "custom-scrollbar flex-1 space-y-2 overflow-y-auto p-4",
        children:
          activities.length === 0
            ? _jsx("div", {
                className: "p-4 text-center text-sm text-slate-400",
                children: t("common.dashboard.activity.empty"),
              })
            : activities.map((act) =>
                _jsxs(
                  "div",
                  {
                    className:
                      "group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50",
                    children: [
                      _jsxs("div", {
                        className: "flex items-center gap-3",
                        children: [
                          _jsx("div", {
                            className: `flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${
                              act.type === "success"
                                ? "bg-green-500"
                                : act.type === "info"
                                  ? "bg-blue-500"
                                  : "bg-amber-500"
                            }`,
                            children: act.user.charAt(0),
                          }),
                          _jsxs("div", {
                            children: [
                              _jsxs("div", {
                                className:
                                  "mb-1 text-xs leading-none text-slate-800",
                                children: [
                                  _jsx("span", {
                                    className: "font-bold",
                                    children: act.user,
                                  }),
                                  " ",
                                  _jsx("span", {
                                    className: "text-slate-500",
                                    children: act.action,
                                  }),
                                ],
                              }),
                              _jsx("div", {
                                className:
                                  "text-[10px] font-medium text-slate-900",
                                children: act.target,
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsx("span", {
                        className:
                          "ml-3 w-12 shrink-0 break-words text-right text-[10px] leading-tight text-slate-400",
                        children: act.time,
                      }),
                    ],
                  },
                  act.id,
                ),
              ),
      }),
    ],
  });
};
export function DashboardTab() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const selected =
    availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null;
  const dashboardQuery = useQuery({
    queryKey: ["agent_dashboard", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "get_agent_dashboard",
          application_id: activeWorkspaceId,
        },
      });
      if (error) throw error;
      return data;
    },
  });
  const metrics = useMemo(() => {
    const d = dashboardQuery.data;
    return {
      leads: Number(d?.leads?.count ?? 0),
      contacts: Number(d?.contacts?.count ?? 0),
      paid: Number(d?.payouts?.paid ?? 0),
      pending: Number(d?.payouts?.pending ?? 0),
      projects: Number(d?.projects?.count ?? 0),
    };
  }, [dashboardQuery.data]);
  // Generate mock revenue data based on real metrics
  const revenueData = useMemo(() => {
    const base = metrics.paid || 1000;
    return [base * 0.3, base * 0.5, base * 0.4, base * 0.7, base * 0.6, base];
  }, [metrics.paid]);
  // Generate activity feed from dashboard data
  const activities = useMemo(() => {
    const items = [];
    if (metrics.leads > 0) {
      items.push({
        id: 1,
        user: t("common.dashboard.activity.system"),
        action: t("common.dashboard.activity.newLead"),
        target: `${metrics.leads} ${t("common.dashboard.activity.leadsLabel")}`,
        time: t("common.dashboard.activity.recent"),
        type: "info",
      });
    }
    if (metrics.paid > 0) {
      items.push({
        id: 2,
        user: t("common.dashboard.activity.system"),
        action: t("common.dashboard.activity.commissionPaid"),
        target: `$${metrics.paid.toLocaleString()}`,
        time: t("common.dashboard.activity.thisMonth"),
        type: "success",
      });
    }
    if (metrics.pending > 0) {
      items.push({
        id: 3,
        user: t("common.dashboard.activity.system"),
        action: t("common.dashboard.activity.pendingPayout"),
        target: `$${metrics.pending.toLocaleString()}`,
        time: t("common.dashboard.activity.inPipeline"),
        type: "warning",
      });
    }
    return items;
  }, [metrics, t]);
  return _jsxs("div", {
    className: "flex h-full flex-col overflow-hidden bg-[#F8FAFC]",
    children: [
      _jsx(ModuleHeader, {
        title: t("common.dashboard.title"),
        subtitle: selected
          ? t("common.dashboard.subtitleWorkspace", {
              workspace: selected.label,
            })
          : t("common.dashboard.subtitleNoWorkspace"),
        hideSearch: true,
      }),
      _jsx("div", {
        className:
          "custom-scrollbar flex-1 overflow-visible p-4 md:overflow-y-auto md:p-8",
        children: _jsx("div", {
          className: "mx-auto max-w-[1600px] space-y-6",
          children: !activeWorkspaceId
            ? _jsxs("div", {
                className:
                  "flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
                children: [
                  _jsx(Lock, { size: 18, className: "text-slate-400" }),
                  _jsxs("div", {
                    children: [
                      _jsx("div", {
                        className: "font-bold text-slate-900",
                        children: t("common.workspace.noActiveTitle"),
                      }),
                      _jsx("div", {
                        className: "text-sm text-slate-600",
                        children: t("common.workspace.pickInSidebar"),
                      }),
                    ],
                  }),
                ],
              })
            : dashboardQuery.isLoading
              ? _jsx("div", {
                  className: "text-sm text-slate-500",
                  children: t("common.common.loading"),
                })
              : _jsxs(_Fragment, {
                  children: [
                    _jsxs("div", {
                      className:
                        "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4",
                      children: [
                        _jsx(MetricCard, {
                          title: t("common.dashboard.metrics.commissionPaid"),
                          value: `$${metrics.paid.toLocaleString()}`,
                          trend: metrics.paid > 0 ? "+15%" : undefined,
                          trendUp: true,
                          icon: _jsx(Wallet, { size: 22 }),
                          color: "emerald",
                          chartData: revenueData,
                        }),
                        _jsx(MetricCard, {
                          title: t(
                            "common.dashboard.metrics.commissionPending",
                          ),
                          value: `$${metrics.pending.toLocaleString()}`,
                          trend: metrics.pending > 0 ? "+8%" : undefined,
                          trendUp: true,
                          icon: _jsx(Handshake, { size: 22 }),
                          color: "purple",
                          subtext: t(
                            "common.dashboard.metrics.projectsSubtext",
                            {
                              count: metrics.projects,
                            },
                          ),
                        }),
                        _jsx(MetricCard, {
                          title: t("common.dashboard.metrics.leads"),
                          value: metrics.leads,
                          trend: metrics.leads > 0 ? "+4" : undefined,
                          trendUp: true,
                          icon: _jsx(Zap, { size: 22 }),
                          color: "blue",
                          chartData: [10, 12, 15, 14, 18, metrics.leads || 22],
                          subtext: metrics.contacts
                            ? t("common.dashboard.metrics.contactsSubtext", {
                                count: metrics.contacts,
                              })
                            : undefined,
                        }),
                        _jsx(MetricCard, {
                          title: t("common.dashboard.metrics.catalog"),
                          value: metrics.projects,
                          trend: metrics.projects > 0 ? "+1" : undefined,
                          trendUp: true,
                          icon: _jsx(Layers, { size: 22 }),
                          color: "amber",
                          chartData: [3, 4, 4, 5, 5, metrics.projects || 6],
                          subtext: t(
                            "common.dashboard.metrics.availableProjects",
                          ),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className:
                        "grid h-auto grid-cols-1 gap-6 lg:h-[400px] lg:grid-cols-3",
                      children: [
                        _jsx("div", {
                          className: "h-full lg:col-span-2",
                          children: _jsx(RevenueChart, {
                            data: revenueData,
                            t: t,
                          }),
                        }),
                        _jsx("div", {
                          className: "h-full",
                          children: _jsx(LiveActivityFeed, {
                            activities: activities,
                            t: t,
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
        }),
      }),
    ],
  });
}
