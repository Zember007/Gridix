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

type AnalyticsView = "crm" | "finance";

// --- CRM View Component ---
interface CrmViewProps {
  leadsCount: number;
  byStage: Array<{ id: string; name: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  conversionRate: number;
  t: (key: string) => string;
}

const CrmView = ({ leadsCount, byStage, bySource, conversionRate, t }: CrmViewProps) => {
  const totalInFunnel = byStage.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-w-0">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={18} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("common.analytics.crm.totalLeads")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{leadsCount}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <PieChart size={18} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("common.analytics.crm.inFunnel")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalInFunnel}</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("common.analytics.crm.conversion")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{conversionRate.toFixed(1)}%</h3>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Calendar size={18} />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("common.analytics.crm.sources")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{bySource.length}</h3>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">{t("common.analytics.crm.funnelTitle")}</h3>
        </div>
        <div className="p-6">
          {byStage.length ? (
            <div className="space-y-3">
              {byStage.map((stage, idx) => {
                const percentage = leadsCount > 0 ? (stage.count / leadsCount) * 100 : 0;
                const colors = [
                  "bg-blue-500",
                  "bg-indigo-500",
                  "bg-purple-500",
                  "bg-pink-500",
                  "bg-emerald-500",
                ];
                return (
                  <div key={stage.id} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{stage.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">{stage.count}</span>
                        <span className="text-xs text-slate-400">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-8">
              {t("common.analytics.sales.noStageData")}
            </div>
          )}
        </div>
      </div>

      {/* Sources */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">{t("common.analytics.crm.sourceBreakdown")}</h3>
        </div>
        <div className="p-6">
          {bySource.length ? (
            <div className="flex flex-wrap gap-2">
              {bySource.map((s) => (
                <span
                  key={s.source}
                  className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2"
                >
                  <span className="w-2 h-2 bg-blue-500 rounded-full" />
                  {s.source}: <span className="text-slate-900">{s.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500 text-center py-4">
              {t("common.analytics.sales.noSourceData")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Finance View Component ---
interface FinanceViewProps {
  paid: number;
  pending: number;
  payoutCount: number;
  payouts: Array<{
    id: string;
    amount?: number;
    payout_date?: string;
    status?: string;
    project_name?: string;
  }>;
  t: (key: string) => string;
}

const FinanceView = ({ paid, pending, payoutCount, payouts, t }: FinanceViewProps) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-w-0">
      {/* Info Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 min-w-0">
        <div className="p-2 bg-white text-slate-600 rounded-lg mt-0.5 border border-slate-100 shrink-0">
          <Wallet size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900">{t("common.analytics.finance.registryTitle")}</h3>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {t("common.analytics.finance.registryDescription")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider min-w-0 break-words">
              {t("common.analytics.finance.pipeline")}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded shrink-0">
              <ArrowUpRight size={10} />
              {t("common.analytics.finance.inProgress")}
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">${pending.toLocaleString()}</h3>
          <span className="text-xs text-slate-500 mt-1 block">
            {payoutCount} {t("common.analytics.finance.dealsInWork")}
          </span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider min-w-0 break-words">
              {t("common.analytics.finance.received")}
            </p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded shrink-0">
              <ArrowUpRight size={10} />
              {t("common.analytics.finance.success")}
            </div>
          </div>
          <h3 className="text-2xl font-black text-green-600">${paid.toLocaleString()}</h3>
          <span className="text-xs text-slate-500 mt-1 block">
            {t("common.analytics.finance.successDeals")}
          </span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider min-w-0 break-words">
              {t("common.analytics.finance.total")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">${(paid + pending).toLocaleString()}</h3>
          <span className="text-xs text-slate-500 mt-1 block">
            {t("common.analytics.finance.allTime")}
          </span>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-w-0">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 min-w-0">
          <h3 className="font-bold text-slate-900 text-sm">{t("common.analytics.finance.registry")}</h3>
          <button
            type="button"
            aria-label={t("common.analytics.finance.export")}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 shrink-0"
          >
            <Download size={14} />
            <span className="hidden sm:inline">{t("common.analytics.finance.export")}</span>
          </button>
        </div>
        <div className="overflow-x-auto min-w-0 max-w-full overscroll-x-contain">
          {payouts.length ? (
            <table className="w-full min-w-[480px] text-left">
              <thead className="bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-3 sm:px-6 py-3 whitespace-nowrap">{t("common.analytics.finance.colAmount")}</th>
                  <th className="px-3 sm:px-6 py-3 whitespace-nowrap">{t("common.analytics.finance.colProject")}</th>
                  <th className="px-3 sm:px-6 py-3 whitespace-nowrap">{t("common.analytics.finance.colDate")}</th>
                  <th className="px-3 sm:px-6 py-3 whitespace-nowrap">{t("common.analytics.finance.colStatus")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payouts.slice(0, 30).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      ${Number(p.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-slate-700">
                      <div className="truncate max-w-[220px]">{p.project_name ?? t("common.common.empty")}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-slate-500 whitespace-nowrap">
                      {p.payout_date
                        ? new Date(p.payout_date).toLocaleDateString()
                        : t("common.common.empty")}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          String(p.status) === "paid"
                            ? "bg-green-50 text-green-700"
                            : String(p.status) === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {String(p.status) === "paid"
                          ? t("common.analytics.finance.statusPaid")
                          : String(p.status) === "pending"
                            ? t("common.analytics.finance.statusPending")
                            : String(p.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-slate-500 text-center py-8">
              {t("common.analytics.finance.noPayouts")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function AnalyticsTab() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const [view, setView] = useState<AnalyticsView>("crm");
  const [period, setPeriod] = useState("30");

  const selected = useMemo(
    () => availableWorkspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [availableWorkspaces, activeWorkspaceId]
  );

  const analyticsQuery = useQuery({
    queryKey: ["agent_analytics_page", activeWorkspaceId, period],
    enabled: !!activeWorkspaceId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("agent-program", {
        body: { action: "get_agent_analytics_page", application_id: activeWorkspaceId, period },
      });
      if (error) throw error;
      return data as Record<string, unknown>;
    },
  });

  const salesData = (analyticsQuery.data as Record<string, unknown>)?.sales as Record<string, unknown> | undefined;
  const financeData = (analyticsQuery.data as Record<string, unknown>)?.finance as Record<string, unknown> | undefined;

  const leadsCount = Number(salesData?.leads_count ?? 0);
  const byStage = (salesData?.by_stage ?? []) as Array<{ id: string; name: string; count: number }>;
  const bySource = (salesData?.by_source ?? []) as Array<{ source: string; count: number }>;
  const conversionRate = Number(salesData?.conversion_rate ?? 5.5);

  const paid = Number((financeData?.stats as Record<string, unknown>)?.paid ?? 0);
  const pending = Number((financeData?.stats as Record<string, unknown>)?.pending ?? 0);
  const payoutCount = Number((financeData?.stats as Record<string, unknown>)?.count ?? 0);
  const payouts = (financeData?.payouts ?? []) as Array<{
    id: string;
    amount?: number;
    payout_date?: string;
    status?: string;
    project_name?: string;
  }>;

  const handleExport = () => {
    // Placeholder for export functionality
    console.log("Export triggered");
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-x-hidden">
      <ModuleHeader
        title={t("common.analytics.title")}
        subtitle={
          selected
            ? t("common.analytics.subtitleWithWorkspace", { workspace: selected.label })
            : t("common.analytics.subtitle")
        }
        hideSearch
        primaryAction={{
          label: t("common.analytics.export"),
          icon: <Download size={18} />,
          onClick: handleExport,
        }}
      />

      {/* Filter Bar */}
      <div className="px-4 md:px-6 py-4 bg-white border-b border-slate-200 flex flex-wrap sm:flex-nowrap gap-3 justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto min-w-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setView("crm")}
            className={`flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              view === "crm"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <PieChart size={16} />
            {t("common.analytics.views.crm")}
          </button>
          <button
            type="button"
            onClick={() => setView("finance")}
            className={`flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              view === "finance"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <Wallet size={16} />
            {t("common.analytics.views.finance")}
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 w-full sm:w-auto min-w-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm text-slate-600 shadow-sm whitespace-nowrap min-w-0">
            <Calendar size={16} className="text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent outline-none font-bold cursor-pointer text-slate-700"
            >
              <option value="7">{t("common.analytics.period.last7")}</option>
              <option value="30">{t("common.analytics.period.last30")}</option>
              <option value="90">{t("common.analytics.period.quarter")}</option>
              <option value="year">{t("common.analytics.period.year")}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        <div className="max-w-[1600px] min-w-0 mx-auto">
          {!activeWorkspaceId ? (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900">{t("common.workspace.noActiveTitle")}</h3>
              <p className="text-sm text-slate-600 mt-1">{t("common.workspace.pickInSidebar")}</p>
            </div>
          ) : analyticsQuery.isLoading ? (
            <div className="text-sm text-slate-500">{t("common.common.loading")}</div>
          ) : analyticsQuery.isError ? (
            <div className="text-sm text-red-600">{t("common.analytics.loadError")}</div>
          ) : view === "crm" ? (
            <CrmView
              leadsCount={leadsCount}
              byStage={byStage}
              bySource={bySource}
              conversionRate={conversionRate}
              t={t}
            />
          ) : (
            <FinanceView paid={paid} pending={pending} payoutCount={payoutCount} payouts={payouts} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}
