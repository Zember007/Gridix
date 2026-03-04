import { Calendar, PieChart, Wallet } from "lucide-react";
import type { AnalyticsPeriod, AnalyticsView } from "../model/types";

interface Props {
  view: AnalyticsView;
  period: AnalyticsPeriod;
  t: (key: string) => string;
  onViewChange: (value: AnalyticsView) => void;
  onPeriodChange: (value: AnalyticsPeriod) => void;
}

export function AgentAnalyticsToolbar({
  view,
  period,
  t,
  onViewChange,
  onPeriodChange,
}: Props) {
  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-nowrap md:px-6">
      <div className="no-scrollbar flex w-full min-w-0 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-auto">
        <button
          type="button"
          onClick={() => onViewChange("crm")}
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
          onClick={() => onViewChange("finance")}
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
            onChange={(event) =>
              onPeriodChange(event.target.value as AnalyticsPeriod)
            }
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
  );
}
