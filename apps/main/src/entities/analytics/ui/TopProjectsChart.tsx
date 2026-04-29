import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { truncateLabel } from "../lib/utils";
import { AnalyticsChartCard, AnalyticsTooltip } from "./AnalyticsChartCard";

interface TopProjectsChartProps {
  data: Array<{ name: string; views: number; leads: number }>;
  title: string;
  description: string;
  viewsLabel: string;
  leadsLabel: string;
  emptyLabel?: string;
}

export function TopProjectsChart({
  data,
  title,
  description,
  viewsLabel,
  leadsLabel,
  emptyLabel,
}: TopProjectsChartProps) {
  const chartHeight = Math.max(320, data.length * 42);

  return (
    <AnalyticsChartCard
      title={title}
      description={description}
      isEmpty={data.length === 0}
      emptyLabel={emptyLabel}
    >
      <div className="h-[360px] min-w-0 overflow-x-auto sm:h-auto">
        <div className="min-w-[620px]" style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              barGap={6}
              barCategoryGap={12}
              margin={{ top: 8, right: 20, bottom: 8, left: 8 }}
            >
              <CartesianGrid
                stroke="var(--admin-border-light)"
                strokeDasharray="4 6"
                horizontal={false}
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                tick={{ fill: "var(--admin-text-muted)", fontSize: 12 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                width={148}
                tick={{ fill: "var(--admin-text-secondary)", fontSize: 12 }}
                tickFormatter={(value: string) => truncateLabel(value, 18)}
              />
              <Tooltip content={<AnalyticsTooltip />} cursor={false} />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              />
              <Bar
                dataKey="views"
                fill="var(--admin-primary)"
                name={viewsLabel}
                radius={[0, 6, 6, 0]}
                isAnimationActive
              />
              <Bar
                dataKey="leads"
                fill="var(--admin-success)"
                name={leadsLabel}
                radius={[0, 6, 6, 0]}
                isAnimationActive
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AnalyticsChartCard>
  );
}
