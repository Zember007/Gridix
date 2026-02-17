import React, { useState, useRef, useMemo } from "react";

interface ChartDataPoint {
  value: number;
  date: string;
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  const height = 250;
  const width = 800;
  const padding = 20;

  const maxVal = Math.max(...data) * 1.1; // Add 10% headroom
  const minVal = 0;

  // Memoize points calculation
  const points = useMemo(() => {
    return data.map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y =
        height -
        ((val - minVal) / (maxVal - minVal || 1)) * (height - padding * 2) -
        padding;
      return { x, y, val, date: dates[i] };
    });
  }, [data, dates, maxVal, minVal]);

  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;
  const areaD = `${pathD} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Find closest point based on X coordinate (responsive scaling handled by viewBox)
    // We map screen X back to viewBox X
    const scaleX = width / rect.width;
    const svgX = x * scaleX;

    // Find closest index
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

  return (
    <div
      ref={containerRef}
      className="group relative h-full w-full cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full overflow-visible"
        preserveAspectRatio="none"
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
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e2e8f0"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={width - padding}
          y2={padding}
          stroke="#e2e8f0"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
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
              y1={padding}
              x2={activePoint.x}
              y2={height - padding}
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

      {/* Tooltip */}
      {activePoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full transform rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-xl transition-all duration-75"
          style={{
            left: `${(activePoint.x / width) * 100}%`,
            top: `${(activePoint.y / height) * 100}%`,
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
