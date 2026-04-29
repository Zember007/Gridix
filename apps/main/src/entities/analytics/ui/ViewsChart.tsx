import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsChartCard, AnalyticsTooltip } from "./AnalyticsChartCard";

interface ViewsChartProps {
  data: Array<{ date: string; views: number }>;
  title: string;
  description: string;
  emptyLabel?: string;
}

export function ViewsChart({
  data,
  title,
  description,
  emptyLabel,
}: ViewsChartProps) {
  return (
    <AnalyticsChartCard
      title={title}
      description={description}
      isEmpty={data.length === 0}
      emptyLabel={emptyLabel}
    >
      <div className="h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 12, bottom: 0, left: -18 }}
          >
            <CartesianGrid
              stroke="var(--admin-border-light)"
              strokeDasharray="4 6"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              minTickGap={24}
              tick={{ fill: "var(--admin-text-muted)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              width={48}
              tick={{ fill: "var(--admin-text-muted)", fontSize: 12 }}
            />
            <Tooltip content={<AnalyticsTooltip />} cursor={false} />
            <Line
              type="monotone"
              dataKey="views"
              name={title}
              stroke="var(--admin-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2 }}
              isAnimationActive
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </AnalyticsChartCard>
  );
}
