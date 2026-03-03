import type { AnalyticsCrmData } from "../../model/types";

interface Props {
  bySource: AnalyticsCrmData["bySource"];
  t: (key: string) => string;
}

export function CrmSourceBreakdown({ bySource, t }: Props) {
  return (
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
  );
}
