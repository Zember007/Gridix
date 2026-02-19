import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useWorkspace } from "@gridix/utils/react";
import {
  TrendingUp,
  Users,
  Wallet,
  Calendar,
  PieChart,
  Download,
  ArrowUpRight,
} from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/contexts/LanguageContext";
const CrmView = ({ leadsCount, byStage, bySource, conversionRate, t }) => {
  const totalInFunnel = byStage.reduce((sum, s) => sum + s.count, 0);
  return _jsxs("div", {
    className:
      "min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4",
    children: [
      _jsxs("div", {
        className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
        children: [
          _jsxs("div", {
            className:
              "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
            children: [
              _jsxs("div", {
                className: "mb-3 flex items-center gap-3",
                children: [
                  _jsx("div", {
                    className: "rounded-lg bg-blue-50 p-2 text-blue-600",
                    children: _jsx(Users, { size: 18 }),
                  }),
                  _jsx("p", {
                    className:
                      "text-xs font-bold uppercase tracking-wider text-slate-400",
                    children: t("common.analytics.crm.totalLeads"),
                  }),
                ],
              }),
              _jsx("h3", {
                className: "text-2xl font-black text-slate-900",
                children: leadsCount,
              }),
            ],
          }),
          _jsxs("div", {
            className:
              "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
            children: [
              _jsxs("div", {
                className: "mb-3 flex items-center gap-3",
                children: [
                  _jsx("div", {
                    className: "rounded-lg bg-purple-50 p-2 text-purple-600",
                    children: _jsx(PieChart, { size: 18 }),
                  }),
                  _jsx("p", {
                    className:
                      "text-xs font-bold uppercase tracking-wider text-slate-400",
                    children: t("common.analytics.crm.inFunnel"),
                  }),
                ],
              }),
              _jsx("h3", {
                className: "text-2xl font-black text-slate-900",
                children: totalInFunnel,
              }),
            ],
          }),
          _jsxs("div", {
            className:
              "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
            children: [
              _jsxs("div", {
                className: "mb-3 flex items-center gap-3",
                children: [
                  _jsx("div", {
                    className: "rounded-lg bg-emerald-50 p-2 text-emerald-600",
                    children: _jsx(TrendingUp, { size: 18 }),
                  }),
                  _jsx("p", {
                    className:
                      "text-xs font-bold uppercase tracking-wider text-slate-400",
                    children: t("common.analytics.crm.conversion"),
                  }),
                ],
              }),
              _jsxs("h3", {
                className: "text-2xl font-black text-slate-900",
                children: [conversionRate.toFixed(1), "%"],
              }),
            ],
          }),
          _jsxs("div", {
            className:
              "rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
            children: [
              _jsxs("div", {
                className: "mb-3 flex items-center gap-3",
                children: [
                  _jsx("div", {
                    className: "rounded-lg bg-amber-50 p-2 text-amber-600",
                    children: _jsx(Calendar, { size: 18 }),
                  }),
                  _jsx("p", {
                    className:
                      "text-xs font-bold uppercase tracking-wider text-slate-400",
                    children: t("common.analytics.crm.sources"),
                  }),
                ],
              }),
              _jsx("h3", {
                className: "text-2xl font-black text-slate-900",
                children: bySource.length,
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className:
          "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        children: [
          _jsx("div", {
            className: "border-b border-slate-100 bg-slate-50/50 px-6 py-4",
            children: _jsx("h3", {
              className: "text-sm font-bold text-slate-900",
              children: t("common.analytics.crm.funnelTitle"),
            }),
          }),
          _jsx("div", {
            className: "p-6",
            children: byStage.length
              ? _jsx("div", {
                  className: "space-y-3",
                  children: byStage.map((stage, idx) => {
                    const percentage =
                      leadsCount > 0 ? (stage.count / leadsCount) * 100 : 0;
                    const colors = [
                      "bg-blue-500",
                      "bg-indigo-500",
                      "bg-purple-500",
                      "bg-pink-500",
                      "bg-emerald-500",
                    ];
                    return _jsxs(
                      "div",
                      {
                        className: "group",
                        children: [
                          _jsxs("div", {
                            className:
                              "mb-1.5 flex items-center justify-between",
                            children: [
                              _jsx("span", {
                                className: "text-sm font-medium text-slate-700",
                                children: stage.name,
                              }),
                              _jsxs("div", {
                                className: "flex items-center gap-2",
                                children: [
                                  _jsx("span", {
                                    className:
                                      "text-sm font-black text-slate-900",
                                    children: stage.count,
                                  }),
                                  _jsxs("span", {
                                    className: "text-xs text-slate-400",
                                    children: [
                                      "(",
                                      percentage.toFixed(1),
                                      "%)",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsx("div", {
                            className:
                              "h-3 w-full overflow-hidden rounded-full bg-slate-100",
                            children: _jsx("div", {
                              className: `h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`,
                              style: { width: `${percentage}%` },
                            }),
                          }),
                        ],
                      },
                      stage.id,
                    );
                  }),
                })
              : _jsx("div", {
                  className: "py-8 text-center text-sm text-slate-500",
                  children: t("common.analytics.sales.noStageData"),
                }),
          }),
        ],
      }),
      _jsxs("div", {
        className:
          "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        children: [
          _jsx("div", {
            className: "border-b border-slate-100 bg-slate-50/50 px-6 py-4",
            children: _jsx("h3", {
              className: "text-sm font-bold text-slate-900",
              children: t("common.analytics.crm.sourceBreakdown"),
            }),
          }),
          _jsx("div", {
            className: "p-6",
            children: bySource.length
              ? _jsx("div", {
                  className: "flex flex-wrap gap-2",
                  children: bySource.map((s) =>
                    _jsxs(
                      "span",
                      {
                        className:
                          "flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700",
                        children: [
                          _jsx("span", {
                            className: "h-2 w-2 rounded-full bg-blue-500",
                          }),
                          s.source,
                          ": ",
                          _jsx("span", {
                            className: "text-slate-900",
                            children: s.count,
                          }),
                        ],
                      },
                      s.source,
                    ),
                  ),
                })
              : _jsx("div", {
                  className: "py-4 text-center text-sm text-slate-500",
                  children: t("common.analytics.sales.noSourceData"),
                }),
          }),
        ],
      }),
    ],
  });
};
const FinanceView = ({ paid, pending, payoutCount, payouts, t }) => {
  return _jsxs("div", {
    className:
      "min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4",
    children: [
      _jsxs("div", {
        className:
          "flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4",
        children: [
          _jsx("div", {
            className:
              "mt-0.5 shrink-0 rounded-lg border border-slate-100 bg-white p-2 text-slate-600",
            children: _jsx(Wallet, { size: 20 }),
          }),
          _jsxs("div", {
            className: "min-w-0",
            children: [
              _jsx("h3", {
                className: "font-bold text-slate-900",
                children: t("common.analytics.finance.registryTitle"),
              }),
              _jsx("p", {
                className: "mt-1 text-sm leading-relaxed text-slate-600",
                children: t("common.analytics.finance.registryDescription"),
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3",
        children: [
          _jsxs("div", {
            className:
              "min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
            children: [
              _jsxs("div", {
                className:
                  "mb-2 flex min-w-0 items-start justify-between gap-2",
                children: [
                  _jsx("p", {
                    className:
                      "min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400",
                    children: t("common.analytics.finance.pipeline"),
                  }),
                  _jsxs("div", {
                    className:
                      "flex shrink-0 items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600",
                    children: [
                      _jsx(ArrowUpRight, { size: 10 }),
                      t("common.analytics.finance.inProgress"),
                    ],
                  }),
                ],
              }),
              _jsxs("h3", {
                className: "text-2xl font-black text-slate-900",
                children: ["$", pending.toLocaleString()],
              }),
              _jsxs("span", {
                className: "mt-1 block text-xs text-slate-500",
                children: [
                  payoutCount,
                  " ",
                  t("common.analytics.finance.dealsInWork"),
                ],
              }),
            ],
          }),
          _jsxs("div", {
            className:
              "min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
            children: [
              _jsxs("div", {
                className:
                  "mb-2 flex min-w-0 items-start justify-between gap-2",
                children: [
                  _jsx("p", {
                    className:
                      "min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400",
                    children: t("common.analytics.finance.received"),
                  }),
                  _jsxs("div", {
                    className:
                      "flex shrink-0 items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600",
                    children: [
                      _jsx(ArrowUpRight, { size: 10 }),
                      t("common.analytics.finance.success"),
                    ],
                  }),
                ],
              }),
              _jsxs("h3", {
                className: "text-2xl font-black text-green-600",
                children: ["$", paid.toLocaleString()],
              }),
              _jsx("span", {
                className: "mt-1 block text-xs text-slate-500",
                children: t("common.analytics.finance.successDeals"),
              }),
            ],
          }),
          _jsxs("div", {
            className:
              "min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm",
            children: [
              _jsx("div", {
                className:
                  "mb-2 flex min-w-0 items-start justify-between gap-2",
                children: _jsx("p", {
                  className:
                    "min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400",
                  children: t("common.analytics.finance.total"),
                }),
              }),
              _jsxs("h3", {
                className: "text-2xl font-black text-slate-900",
                children: ["$", (paid + pending).toLocaleString()],
              }),
              _jsx("span", {
                className: "mt-1 block text-xs text-slate-500",
                children: t("common.analytics.finance.allTime"),
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className:
          "min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
        children: [
          _jsxs("div", {
            className:
              "flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6",
            children: [
              _jsx("h3", {
                className: "text-sm font-bold text-slate-900",
                children: t("common.analytics.finance.registry"),
              }),
              _jsxs("button", {
                type: "button",
                "aria-label": t("common.analytics.finance.export"),
                className:
                  "flex shrink-0 items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900",
                children: [
                  _jsx(Download, { size: 14 }),
                  _jsx("span", {
                    className: "hidden sm:inline",
                    children: t("common.analytics.finance.export"),
                  }),
                ],
              }),
            ],
          }),
          _jsx("div", {
            className:
              "min-w-0 max-w-full overflow-x-auto overscroll-x-contain",
            children: payouts.length
              ? _jsxs("table", {
                  className: "w-full min-w-[480px] text-left",
                  children: [
                    _jsx("thead", {
                      className:
                        "bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400",
                      children: _jsxs("tr", {
                        children: [
                          _jsx("th", {
                            className: "whitespace-nowrap px-3 py-3 sm:px-6",
                            children: t("common.analytics.finance.colAmount"),
                          }),
                          _jsx("th", {
                            className: "whitespace-nowrap px-3 py-3 sm:px-6",
                            children: t("common.analytics.finance.colProject"),
                          }),
                          _jsx("th", {
                            className: "whitespace-nowrap px-3 py-3 sm:px-6",
                            children: t("common.analytics.finance.colDate"),
                          }),
                          _jsx("th", {
                            className: "whitespace-nowrap px-3 py-3 sm:px-6",
                            children: t("common.analytics.finance.colStatus"),
                          }),
                        ],
                      }),
                    }),
                    _jsx("tbody", {
                      className: "divide-y divide-slate-100 text-sm",
                      children: payouts
                        .slice(0, 30)
                        .map((p) =>
                          _jsxs(
                            "tr",
                            {
                              className: "transition-colors hover:bg-slate-50",
                              children: [
                                _jsxs("td", {
                                  className:
                                    "whitespace-nowrap px-3 py-4 font-mono font-bold text-slate-900 sm:px-6",
                                  children: [
                                    "$",
                                    Number(p.amount ?? 0).toLocaleString(),
                                  ],
                                }),
                                _jsx("td", {
                                  className: "px-3 py-4 text-slate-700 sm:px-6",
                                  children: _jsx("div", {
                                    className: "max-w-[220px] truncate",
                                    children:
                                      p.project_name ??
                                      t("common.common.empty"),
                                  }),
                                }),
                                _jsx("td", {
                                  className:
                                    "whitespace-nowrap px-3 py-4 text-slate-500 sm:px-6",
                                  children: p.payout_date
                                    ? new Date(
                                        p.payout_date,
                                      ).toLocaleDateString()
                                    : t("common.common.empty"),
                                }),
                                _jsx("td", {
                                  className:
                                    "whitespace-nowrap px-3 py-4 sm:px-6",
                                  children: _jsx("span", {
                                    className: `rounded-lg px-2 py-1 text-xs font-bold ${
                                      String(p.status) === "paid"
                                        ? "bg-green-50 text-green-700"
                                        : String(p.status) === "pending"
                                          ? "bg-amber-50 text-amber-700"
                                          : "bg-slate-100 text-slate-700"
                                    }`,
                                    children:
                                      String(p.status) === "paid"
                                        ? t(
                                            "common.analytics.finance.statusPaid",
                                          )
                                        : String(p.status) === "pending"
                                          ? t(
                                              "common.analytics.finance.statusPending",
                                            )
                                          : String(p.status),
                                  }),
                                }),
                              ],
                            },
                            p.id,
                          ),
                        ),
                    }),
                  ],
                })
              : _jsx("div", {
                  className: "py-8 text-center text-sm text-slate-500",
                  children: t("common.analytics.finance.noPayouts"),
                }),
          }),
        ],
      }),
    ],
  });
};
export function AnalyticsTab() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const [view, setView] = useState("crm");
  const [period, setPeriod] = useState("30");
  const selected = useMemo(
    () => availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [availableWorkspaces, activeWorkspaceId],
  );
  const analyticsQuery = useQuery({
    queryKey: ["agent_analytics_page", activeWorkspaceId, period],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: {
          action: "get_agent_analytics_page",
          application_id: activeWorkspaceId,
          period,
        },
      });
      if (error) throw error;
      return data;
    },
  });
  const salesData = analyticsQuery.data?.sales;
  const financeData = analyticsQuery.data?.finance;
  const leadsCount = Number(salesData?.leads_count ?? 0);
  const byStage = salesData?.by_stage ?? [];
  const bySource = salesData?.by_source ?? [];
  const conversionRate = Number(salesData?.conversion_rate ?? 5.5);
  const paid = Number(financeData?.stats?.paid ?? 0);
  const pending = Number(financeData?.stats?.pending ?? 0);
  const payoutCount = Number(financeData?.stats?.count ?? 0);
  const payouts = financeData?.payouts ?? [];
  const handleExport = () => {
    // Placeholder for export functionality
    console.log("Export triggered");
  };
  return _jsxs("div", {
    className: "flex h-full flex-col overflow-x-hidden bg-[#F8FAFC]",
    children: [
      _jsx(ModuleHeader, {
        title: t("common.analytics.title"),
        subtitle: selected
          ? t("common.analytics.subtitleWithWorkspace", {
              workspace: selected.label,
            })
          : t("common.analytics.subtitle"),
        hideSearch: true,
        primaryAction: {
          label: t("common.analytics.export"),
          icon: _jsx(Download, { size: 18 }),
          onClick: handleExport,
        },
      }),
      _jsxs("div", {
        className:
          "sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-nowrap md:px-6",
        children: [
          _jsxs("div", {
            className:
              "no-scrollbar flex w-full min-w-0 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-auto",
            children: [
              _jsxs("button", {
                type: "button",
                onClick: () => setView("crm"),
                className: `flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-all sm:flex-none ${
                  view === "crm"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`,
                children: [
                  _jsx(PieChart, { size: 16 }),
                  t("common.analytics.views.crm"),
                ],
              }),
              _jsxs("button", {
                type: "button",
                onClick: () => setView("finance"),
                className: `flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-all sm:flex-none ${
                  view === "finance"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`,
                children: [
                  _jsx(Wallet, { size: 16 }),
                  t("common.analytics.views.finance"),
                ],
              }),
            ],
          }),
          _jsx("div", {
            className:
              "flex w-full min-w-0 items-center justify-end gap-3 sm:w-auto",
            children: _jsxs("div", {
              className:
                "flex min-w-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm",
              children: [
                _jsx(Calendar, { size: 16, className: "text-slate-400" }),
                _jsxs("select", {
                  value: period,
                  onChange: (e) => setPeriod(e.target.value),
                  className:
                    "cursor-pointer bg-transparent font-bold text-slate-700 outline-none",
                  children: [
                    _jsx("option", {
                      value: "7",
                      children: t("common.analytics.period.last7"),
                    }),
                    _jsx("option", {
                      value: "30",
                      children: t("common.analytics.period.last30"),
                    }),
                    _jsx("option", {
                      value: "90",
                      children: t("common.analytics.period.quarter"),
                    }),
                    _jsx("option", {
                      value: "year",
                      children: t("common.analytics.period.year"),
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      _jsx("div", {
        className: "custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6",
        children: _jsx("div", {
          className: "mx-auto min-w-0 max-w-[1600px]",
          children: !activeWorkspaceId
            ? _jsxs("div", {
                className: "rounded-xl border border-slate-200 bg-white p-6",
                children: [
                  _jsx("h3", {
                    className: "font-bold text-slate-900",
                    children: t("common.workspace.noActiveTitle"),
                  }),
                  _jsx("p", {
                    className: "mt-1 text-sm text-slate-600",
                    children: t("common.workspace.pickInSidebar"),
                  }),
                ],
              })
            : analyticsQuery.isLoading
              ? _jsx("div", {
                  className: "text-sm text-slate-500",
                  children: t("common.common.loading"),
                })
              : analyticsQuery.isError
                ? _jsx("div", {
                    className: "text-sm text-red-600",
                    children: t("common.analytics.loadError"),
                  })
                : view === "crm"
                  ? _jsx(CrmView, {
                      leadsCount: leadsCount,
                      byStage: byStage,
                      bySource: bySource,
                      conversionRate: conversionRate,
                      t: t,
                    })
                  : _jsx(FinanceView, {
                      paid: paid,
                      pending: pending,
                      payoutCount: payoutCount,
                      payouts: payouts,
                      t: t,
                    }),
        }),
      }),
    ],
  });
}
