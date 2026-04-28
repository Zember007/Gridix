import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
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

interface TopApartmentsSectionProps {
  data: Array<{
    apartment_number: string;
    project_name: string;
    views: number;
  }>;
  title: string;
  description: string;
  apartmentLabel: string;
  projectLabel: string;
  viewsLabel: string;
  emptyLabel?: string;
}

export function TopApartmentsSection({
  data,
  title,
  description,
  apartmentLabel,
  projectLabel,
  viewsLabel,
  emptyLabel,
}: TopApartmentsSectionProps) {
  const chartHeight = Math.max(300, data.length * 40);

  return (
    <AnalyticsChartCard
      title={title}
      description={description}
      isEmpty={data.length === 0}
      emptyLabel={emptyLabel}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="h-[340px] min-w-0 overflow-x-auto xl:h-auto">
          <div className="min-w-[560px]" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
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
                  dataKey="apartment_number"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  width={96}
                  tick={{ fill: "var(--admin-text-secondary)", fontSize: 12 }}
                  tickFormatter={(value: string) => `№${value}`}
                />
                <Tooltip
                  content={({ active, label, payload }) => (
                    <AnalyticsTooltip
                      active={active}
                      label={`${apartmentLabel} №${label}`}
                      payload={payload?.map((item) => ({
                        name: viewsLabel,
                        value: item.value as number,
                        color: item.color,
                      }))}
                    />
                  )}
                  cursor={false}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                />
                <Bar
                  dataKey="views"
                  fill="var(--admin-warning)"
                  name={viewsLabel}
                  radius={[0, 6, 6, 0]}
                  isAnimationActive
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="whitespace-nowrap">
                  {apartmentLabel}
                </TableHead>
                <TableHead className="min-w-44">{projectLabel}</TableHead>
                <TableHead className="whitespace-nowrap text-right">
                  {viewsLabel}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((apartment, index) => (
                <TableRow key={`${apartment.apartment_number}-${index}`}>
                  <TableCell className="whitespace-nowrap font-medium tabular-nums">
                    №{apartment.apartment_number}
                  </TableCell>
                  <TableCell
                    className="max-w-56 truncate text-muted-foreground"
                    title={apartment.project_name}
                  >
                    {truncateLabel(apartment.project_name, 34)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {apartment.views}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AnalyticsChartCard>
  );
}
