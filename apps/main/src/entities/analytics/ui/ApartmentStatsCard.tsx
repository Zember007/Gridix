import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AnalyticsChartCard, AnalyticsTooltip } from "./AnalyticsChartCard";

interface ApartmentStatsCardProps {
  stats: {
    available: number;
    sold: number;
    reserved: number;
  };
  title: string;
  description: string;
  labels: {
    available: string;
    sold: string;
    reserved: string;
  };
  emptyLabel?: string;
}

export function ApartmentStatsCard({
  stats,
  title,
  description,
  labels,
  emptyLabel,
}: ApartmentStatsCardProps) {
  const chartData = [
    {
      name: labels.available,
      value: stats.available,
      color: "var(--admin-success)",
    },
    { name: labels.sold, value: stats.sold, color: "var(--admin-error)" },
    {
      name: labels.reserved,
      value: stats.reserved,
      color: "var(--admin-warning)",
    },
  ].filter((item) => item.value > 0);
  const total = stats.available + stats.sold + stats.reserved;

  return (
    <AnalyticsChartCard
      title={title}
      description={description}
      isEmpty={chartData.length === 0}
      emptyLabel={emptyLabel}
    >
      <div className="grid min-h-[300px] items-center gap-5 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.8fr)]">
        <div className="relative h-[260px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive
              >
                {chartData.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <Tooltip content={<AnalyticsTooltip />} cursor={false} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">
              {title}
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {total}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2.5"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsChartCard>
  );
}
