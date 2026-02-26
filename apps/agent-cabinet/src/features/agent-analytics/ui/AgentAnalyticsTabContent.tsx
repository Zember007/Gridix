import { useMemo, useState } from "react";
import { useWorkspace } from "@gridix/utils/react";
import { Calendar, Download, PieChart, Wallet } from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/shared/lib/language";
import {
  CrmView,
  FinanceView,
  mapAnalyticsCrm,
  mapAnalyticsFinance,
} from "@/entities/analytics";
import { LoadingState } from "@/shared/ui/LoadingState";
import type { AnalyticsView } from "../model/types";
import { useAgentAnalyticsQuery } from "../model/useAgentAnalyticsQuery";

export function AgentAnalyticsTabContent() {
  const { t } = useLanguage();
  const { activeWorkspaceId, availableWorkspaces } = useWorkspace();
  const [view, setView] = useState<AnalyticsView>("crm");
  const [period, setPeriod] = useState("30");

  const selected = useMemo(
    () =>
      availableWorkspaces.find(
        (workspace) => workspace.id === activeWorkspaceId,
      ) ?? null,
    [availableWorkspaces, activeWorkspaceId],
  );

  const analyticsQuery = useAgentAnalyticsQuery(activeWorkspaceId, period);

  const crm = useMemo(
    () => mapAnalyticsCrm(analyticsQuery.data),
    [analyticsQuery.data],
  );
  const finance = useMemo(
    () => mapAnalyticsFinance(analyticsQuery.data),
    [analyticsQuery.data],
  );

  const handleExport = () => {
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
              onChange={(event) => setPeriod(event.target.value)}
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
            <LoadingState message={t("common.common.loading")} />
          ) : analyticsQuery.isError ? (
            <div className="text-sm text-red-600">
              {t("common.analytics.loadError")}
            </div>
          ) : view === "crm" ? (
            <CrmView
              leadsCount={crm.leadsCount}
              byStage={crm.byStage}
              bySource={crm.bySource}
              conversionRate={crm.conversionRate}
              t={t}
            />
          ) : (
            <FinanceView
              paid={finance.paid}
              pending={finance.pending}
              payoutCount={finance.payoutCount}
              payouts={finance.payouts}
              t={t}
            />
          )}
        </div>
      </div>
    </div>
  );
}
