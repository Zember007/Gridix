import React, { useState, useMemo } from "react";

const VIEW_W = 800;
const VIEW_H = 250;
const PAD = { top: 16, right: 12, bottom: 28, left: 12 } as const;
const PLOT_W = VIEW_W - PAD.left - PAD.right;
const PLOT_H = VIEW_H - PAD.top - PAD.bottom;

interface IncomeChartProps {
  data: number[];
  dates: string[]; // ISO date strings
  language: string;
}

export const IncomeChart: React.FC<IncomeChartProps> = ({
  data,
  dates,
  language,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const width = VIEW_W;
  const height = VIEW_H;
  const maxVal = Math.max(0, ...data) * 1.1 || 1; // headroom; avoid 0-range
  const minVal = 0;

  const xSpan = Math.max(1, data.length - 1);

  // Memoize points calculation (uniform scaling via SVG meet + aspect-ratio wrapper)
  const points = useMemo(() => {
    return data.map((val, i) => {
      const x = PAD.left + (i / xSpan) * PLOT_W;
      const y =
        PAD.top + PLOT_H - ((val - minVal) / (maxVal - minVal)) * PLOT_H;
      return { x, y, val, date: dates[i] };
    });
  }, [data, dates, maxVal, minVal, xSpan]);

  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const bottomY = PAD.top + PLOT_H;
  const areaD = `${pathD} L ${PAD.left + PLOT_W},${bottomY} L ${PAD.left},${bottomY} Z`;

  const viewBoxToSvgX = (e: React.MouseEvent<SVGSVGElement>): number | null => {
    const svg = e.currentTarget;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = svg.createSVGPoint();
    p.x = e.clientX;
    p.y = e.clientY;
    return p.matrixTransform(ctm.inverse()).x;
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgX = viewBoxToSvgX(e);
    if (svgX === null) return;

    let closestIndex = 0;
    let minDiff = Infinity;

    points.forEach((p, i) => {
      const diff = Math.abs(p.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    });

    setHoveredIndex(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  if (!data.length) {
    return (
      <div className="flex h-32 w-full items-center justify-center text-sm text-gray-400">
        —
      </div>
    );
  }

  return (
    <div className="group relative w-full min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full cursor-crosshair overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        role="presentation"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Grid Lines */}
        <line
          x1={PAD.left}
          y1={bottomY}
          x2={PAD.left + PLOT_W}
          y2={bottomY}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left + PLOT_W}
          y2={PAD.top}
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1={PAD.left}
          y1={PAD.top + PLOT_H / 2}
          x2={PAD.left + PLOT_W}
          y2={PAD.top + PLOT_H / 2}
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Area */}
        <path d={areaD} fill="url(#chartGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Elements */}
        {activePoint && (
          <>
            {/* Vertical Line */}
            <line
              x1={activePoint.x}
              y1={PAD.top}
              x2={activePoint.x}
              y2={bottomY}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            {/* Point */}
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="6"
              fill="white"
              stroke="#22c55e"
              strokeWidth="3"
              filter="url(#glow)"
            />
          </>
        )}
      </svg>

      {/* Tooltip uses same %-of-wrapper as viewBox coords (SVG is full width of wrapper) */}
      {activePoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full transform rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-xl transition-all duration-75"
          style={{
            left: `${(activePoint.x / VIEW_W) * 100}%`,
            top: `${(activePoint.y / VIEW_H) * 100}%`,
            marginTop: "-10px",
          }}
        >
          <div className="text-sm font-bold">${activePoint.val}</div>
          <div className="whitespace-nowrap text-slate-400">
            {activePoint.date
              ? new Date(activePoint.date as string).toLocaleDateString(
                  language === "ru" ? "ru-RU" : "en-US",
                  { day: "numeric", month: "long" },
                )
              : ""}
          </div>
          <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1 rotate-45 bg-slate-900"></div>
        </div>
      )}
    </div>
  );
};
