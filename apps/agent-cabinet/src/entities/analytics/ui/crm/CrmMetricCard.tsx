import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  title: string;
  value: string;
  iconContainerClassName: string;
}

export function CrmMetricCard({
  icon,
  title,
  value,
  iconContainerClassName,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${iconContainerClassName}`}>{icon}</div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
      </div>
      <h3 className="text-2xl font-black text-slate-900">{value}</h3>
    </div>
  );
}
