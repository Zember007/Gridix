import { ArrowUpRight } from "lucide-react";

interface Props {
  title: string;
  value: string;
  subtitle: string;
  valueClassName?: string | undefined;
  badgeText?: string | undefined;
  badgeClassName?: string | undefined;
}

export function FinanceMetricCard({
  title,
  value,
  subtitle,
  valueClassName = "text-slate-900",
  badgeText,
  badgeClassName,
}: Props) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        {badgeText ? (
          <div
            className={`flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${badgeClassName ?? "bg-slate-100 text-slate-700"}`}
          >
            <ArrowUpRight size={10} />
            {badgeText}
          </div>
        ) : null}
      </div>
      <h3 className={`text-2xl font-black ${valueClassName}`}>{value}</h3>
      <span className="mt-1 block text-xs text-slate-500">{subtitle}</span>
    </div>
  );
}
