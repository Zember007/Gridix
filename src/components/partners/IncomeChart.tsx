import React from 'react';

interface IncomeChartProps {
  data: number[];
}

export const IncomeChart: React.FC<IncomeChartProps> = ({ data }) => {
  const height = 250;
  const width = 800; // viewBox width
  const padding = 20;

  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);

  const points = data.map((val, i) => {
    const x =
      (i / Math.max(data.length - 1, 1)) * (width - padding * 2) + padding;
    const y =
      height -
      ((val - minVal) / (maxVal - minVal || 1)) * (height - padding * 2) -
      padding;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <div className="w-full h-full relative group">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="partnerChartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#f3f4f6"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={width - padding}
          y2={padding}
          stroke="#f3f4f6"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="#f3f4f6"
          strokeWidth="1"
        />

        {/* Area */}
        <path d={areaD} fill="url(#partnerChartGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Last point marker */}
        {points.length > 0 && points[points.length - 1] && (
          <circle
            cx={points[points.length - 1]!.split(',')[0]}
            cy={points[points.length - 1]!.split(',')[1]}
            r="4"
            fill="white"
            stroke="#22c55e"
            strokeWidth="2"
          />
        )}
      </svg>
    </div>
  );
};
