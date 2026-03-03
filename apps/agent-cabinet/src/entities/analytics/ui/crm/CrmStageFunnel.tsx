import type { AnalyticsCrmData } from "../../model/types";

const STAGE_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-emerald-500",
];

interface Props {
  leadsCount: AnalyticsCrmData["leadsCount"];
  byStage: AnalyticsCrmData["byStage"];
  t: (key: string) => string;
}

export function CrmStageFunnel({ leadsCount, byStage, t }: Props) {
  return (
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
                      className={`h-full ${STAGE_COLORS[idx % STAGE_COLORS.length]} rounded-full transition-all duration-500`}
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
  );
}
