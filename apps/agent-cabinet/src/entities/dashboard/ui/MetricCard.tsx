import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  trend?: string | undefined;
  trendUp?: boolean;
  icon: React.ReactNode;
  color: string;
  chartData?: number[] | undefined;
  subtext?: string | undefined;
}

export function MetricCard({
  title,
  value,
  trend,
  trendUp = true,
  icon,
  color,
  chartData,
  subtext,
}: Props) {
  const sparklinePath = useMemo(() => {
    if (!chartData || chartData.length === 0) return "";
    const max = Math.max(...chartData);
    const min = Math.min(...chartData);
    const range = max - min || 1;
    const width = 100;
    const height = 30;

    return chartData
      .map((val, i) => {
        const x = (i / (chartData.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");
  }, [chartData]);

  const bgColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:border-slate-300/80 hover:shadow-lg">
      <div className="relative z-10 mb-3 flex items-start justify-between">
        <div
          className={`rounded-xl p-2.5 transition-transform group-hover:scale-110 ${bgColors[color] ?? bgColors.blue}`}
        >
          {icon}
        </div>
        {trend ? (
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${trendUp ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
          >
            {trendUp ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {trend}
          </div>
        ) : null}
      </div>

      <div className="relative z-10">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <h3 className="text-2xl font-black tracking-tight text-slate-900">
          {value}
        </h3>
        {subtext ? (
          <p className="mt-1 text-[10px] font-medium text-slate-400">
            {subtext}
          </p>
        ) : null}
      </div>

      {chartData && chartData.length > 1 ? (
        <div className="absolute bottom-4 right-4 h-8 w-24 opacity-20 transition-opacity group-hover:opacity-50">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 30"
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            <polyline
              points={sparklinePath}
              fill="none"
              stroke={trendUp ? "#10b981" : "#ef4444"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}
    </div>
  );
}
