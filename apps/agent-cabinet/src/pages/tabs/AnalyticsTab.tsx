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

const CrmView = ({
  leadsCount,
  byStage,
  bySource,
  conversionRate,
  t,
}: CrmViewProps) => {
  const totalInFunnel = byStage.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
              <Users size={18} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.crm.totalLeads")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">{leadsCount}</h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
              <PieChart size={18} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.crm.inFunnel")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {totalInFunnel}
          </h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
              <TrendingUp size={18} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.crm.conversion")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {conversionRate.toFixed(1)}%
          </h3>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-600">
              <Calendar size={18} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.crm.sources")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            {bySource.length}
          </h3>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            {t("common.analytics.crm.funnelTitle")}
          </h3>
        </div>
        <div className="p-6">
          {byStage.length ? (
            <div className="space-y-3">
              {byStage.map((stage, idx) => {
                const percentage =
                  leadsCount > 0 ? (stage.count / leadsCount) * 100 : 0;
                const colors = [
                  "bg-blue-500",
                  "bg-indigo-500",
                  "bg-purple-500",
                  "bg-pink-500",
                  "bg-emerald-500",
                ];
                return (
                  <div key={stage.id} className="group">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {stage.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {stage.count}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
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
            <div className="py-8 text-center text-sm text-slate-500">
              {t("common.analytics.sales.noStageData")}
            </div>
          )}
        </div>
      </div>

      {/* Sources */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h3 className="text-sm font-bold text-slate-900">
            {t("common.analytics.crm.sourceBreakdown")}
          </h3>
        </div>
        <div className="p-6">
          {bySource.length ? (
            <div className="flex flex-wrap gap-2">
              {bySource.map((s) => (
                <span
                  key={s.source}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                >
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  {s.source}: <span className="text-slate-900">{s.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-slate-500">
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

const FinanceView = ({
  paid,
  pending,
  payoutCount,
  payouts,
  t,
}: FinanceViewProps) => {
  return (
    <div className="min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      {/* Info Banner */}
      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mt-0.5 shrink-0 rounded-lg border border-slate-100 bg-white p-2 text-slate-600">
          <Wallet size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900">
            {t("common.analytics.finance.registryTitle")}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {t("common.analytics.finance.registryDescription")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.finance.pipeline")}
            </p>
            <div className="flex shrink-0 items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              <ArrowUpRight size={10} />
              {t("common.analytics.finance.inProgress")}
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            ${pending.toLocaleString()}
          </h3>
          <span className="mt-1 block text-xs text-slate-500">
            {payoutCount} {t("common.analytics.finance.dealsInWork")}
          </span>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.finance.received")}
            </p>
            <div className="flex shrink-0 items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
              <ArrowUpRight size={10} />
              {t("common.analytics.finance.success")}
            </div>
          </div>
          <h3 className="text-2xl font-black text-green-600">
            ${paid.toLocaleString()}
          </h3>
          <span className="mt-1 block text-xs text-slate-500">
            {t("common.analytics.finance.successDeals")}
          </span>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.finance.total")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            ${(paid + pending).toLocaleString()}
          </h3>
          <span className="mt-1 block text-xs text-slate-500">
            {t("common.analytics.finance.allTime")}
          </span>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
          <h3 className="text-sm font-bold text-slate-900">
            {t("common.analytics.finance.registry")}
          </h3>
          <button
            type="button"
            aria-label={t("common.analytics.finance.export")}
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <Download size={14} />
            <span className="hidden sm:inline">
              {t("common.analytics.finance.export")}
            </span>
          </button>
        </div>
        <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
          {payouts.length ? (
            <table className="w-full min-w-[480px] text-left">
              <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                    {t("common.analytics.finance.colAmount")}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                    {t("common.analytics.finance.colProject")}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                    {t("common.analytics.finance.colDate")}
                  </th>
                  <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                    {t("common.analytics.finance.colStatus")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payouts.slice(0, 30).map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-3 py-4 font-mono font-bold text-slate-900 sm:px-6">
                      ${Number(p.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 text-slate-700 sm:px-6">
                      <div className="max-w-[220px] truncate">
                        {p.project_name ?? t("common.common.empty")}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-slate-500 sm:px-6">
                      {p.payout_date
                        ? new Date(p.payout_date).toLocaleDateString()
                        : t("common.common.empty")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${
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
            <div className="py-8 text-center text-sm text-slate-500">
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
      return data as Record<string, unknown>;
    },
  });

  const salesData = (analyticsQuery.data as Record<string, unknown>)?.sales as
    | Record<string, unknown>
    | undefined;
  const financeData = (analyticsQuery.data as Record<string, unknown>)
    ?.finance as Record<string, unknown> | undefined;

  const leadsCount = Number(salesData?.leads_count ?? 0);
  const byStage = (salesData?.by_stage ?? []) as Array<{
    id: string;
    name: string;
    count: number;
  }>;
  const bySource = (salesData?.by_source ?? []) as Array<{
    source: string;
    count: number;
  }>;
  const conversionRate = Number(salesData?.conversion_rate ?? 5.5);

  const paid = Number(
    (financeData?.stats as Record<string, unknown>)?.paid ?? 0,
  );
  const pending = Number(
    (financeData?.stats as Record<string, unknown>)?.pending ?? 0,
  );
  const payoutCount = Number(
    (financeData?.stats as Record<string, unknown>)?.count ?? 0,
  );
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
    <div className="flex h-full flex-col overflow-x-hidden bg-[#F8FAFC]">
      <ModuleHeader
        title={t("common.analytics.title")}
        subtitle={
          selected
            ? t("common.analytics.subtitleWithWorkspace", {
                workspace: selected.label,
              })
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
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-nowrap md:px-6">
        <div className="no-scrollbar flex w-full min-w-0 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setView("crm")}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-all sm:flex-none ${
              view === "crm"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <PieChart size={16} />
            {t("common.analytics.views.crm")}
          </button>
          <button
            type="button"
            onClick={() => setView("finance")}
            className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-all sm:flex-none ${
              view === "finance"
                ? "bg-slate-900 text-white shadow-md"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <Wallet size={16} />
            {t("common.analytics.views.finance")}
          </button>
        </div>

        <div className="flex w-full min-w-0 items-center justify-end gap-3 sm:w-auto">
          <div className="flex min-w-0 items-center gap-2 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-sm">
            <Calendar size={16} className="text-slate-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="cursor-pointer bg-transparent font-bold text-slate-700 outline-none"
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
      <div className="custom-scrollbar flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto min-w-0 max-w-[1600px]">
          {!activeWorkspaceId ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold text-slate-900">
                {t("common.workspace.noActiveTitle")}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {t("common.workspace.pickInSidebar")}
              </p>
            </div>
          ) : analyticsQuery.isLoading ? (
            <div className="text-sm text-slate-500">
              {t("common.common.loading")}
            </div>
          ) : analyticsQuery.isError ? (
            <div className="text-sm text-red-600">
              {t("common.analytics.loadError")}
            </div>
          ) : view === "crm" ? (
            <CrmView
              leadsCount={leadsCount}
              byStage={byStage}
              bySource={bySource}
              conversionRate={conversionRate}
              t={t}
            />
          ) : (
            <FinanceView
              paid={paid}
              pending={pending}
              payoutCount={payoutCount}
              payouts={payouts}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}
