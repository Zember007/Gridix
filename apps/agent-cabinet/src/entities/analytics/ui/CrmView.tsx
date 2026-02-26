import { Calendar, TrendingUp, Users } from "lucide-react";
import type { AnalyticsCrmData } from "../model/types";

interface Props extends AnalyticsCrmData {
  t: (key: string) => string;
}

export function CrmView({
  leadsCount,
  byStage,
  bySource,
  conversionRate,
  t,
}: Props) {
  return (
    <div className="min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
}
