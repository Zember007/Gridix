import { Activity } from "lucide-react";
import type { DashboardActivityItem } from "../model/types";

interface Props {
  activities: DashboardActivityItem[];
  t: (key: string) => string;
}

export function LiveActivityFeed({ activities, t }: Props) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-50 bg-slate-50/30 p-6 backdrop-blur-sm">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Activity size={18} className="text-blue-500" />
          {t("common.dashboard.activity.title")}
        </h3>
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1">
          <span className="text-[10px] font-bold uppercase text-blue-700">
            Live
          </span>
        </div>
      </div>
      <div className="custom-scrollbar flex-1 space-y-2 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400">
            {t("common.dashboard.activity.empty")}
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="group flex cursor-pointer items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-slate-100 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ${act.type === "success" ? "bg-green-500" : act.type === "info" ? "bg-blue-500" : "bg-amber-500"}`}
                >
                  {act.user.charAt(0)}
                </div>
                <div>
                  <div className="mb-1 text-xs leading-none text-slate-800">
                    <span className="font-bold">{act.user}</span>{" "}
                    <span className="text-slate-500">{act.action}</span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-900">
                    {act.target}
                  </div>
                </div>
              </div>
              <span className="ml-3 w-12 shrink-0 break-words text-right text-[10px] leading-tight text-slate-400">
                {act.time}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
