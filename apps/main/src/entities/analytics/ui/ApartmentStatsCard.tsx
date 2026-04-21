import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_COLORS } from "../model/types";

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
}

export function ApartmentStatsCard({
  stats,
  title,
  description,
  labels,
}: ApartmentStatsCardProps) {
  const chartData = [
    { name: labels.available, value: stats.available },
    { name: labels.sold, value: stats.sold },
    { name: labels.reserved, value: stats.reserved },
  ].filter((item) => item.value > 0);

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.available}
            </p>
            <p className="text-sm text-muted-foreground">{labels.available}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.sold}</p>
            <p className="text-sm text-muted-foreground">{labels.sold}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {stats.reserved}
            </p>
            <p className="text-sm text-muted-foreground">{labels.reserved}</p>
          </div>
        </div>
        {chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
