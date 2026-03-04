interface Props {
  data: number[];
  t: (key: string) => string;
}

export function RevenueChart({ data, t }: Props) {
  const generatePath = (points: number[], width: number, height: number) => {
    if (points.length === 0) return "";
    const max = Math.max(...points) * 1.1 || 1;
    const coords = points.map((val, i) => ({
      x: (i / Math.max(points.length - 1, 1)) * width,
      y: height - (val / max) * height,
    }));

    const firstCoord = coords[0];
    if (!firstCoord) return "";
    let d = `M ${firstCoord.x},${firstCoord.y}`;
    for (let i = 1; i < coords.length; i++) {
      const curr = coords[i];
      const prev = coords[i - 1];
      if (!curr || !prev) continue;
      const cp1x = prev.x + (curr.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (curr.x - prev.x) / 2;
      const cp2y = curr.y;
      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    return d;
  };

  const path = generatePath(data, 800, 250);
  const area = path ? `${path} L 800,250 L 0,250 Z` : "";

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
      <div className="z-10 mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {t("common.dashboard.chart.title")}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {t("common.dashboard.chart.subtitle")}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-1">
          <button
            type="button"
            className="rounded bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-sm"
          >
            2025
          </button>
        </div>
      </div>
      <div className="relative min-h-[200px] w-full flex-1">
        <svg
          viewBox="0 0 800 250"
          className="h-full w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 50, 100, 150, 200].map((y) => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="800"
              y2={y}
              stroke="#f1f5f9"
              strokeDasharray="4 4"
            />
          ))}
          <path d={area} fill="url(#revGradient)" />
          <path
            d={path}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
