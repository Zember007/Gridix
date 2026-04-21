import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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

interface TopProjectsChartProps {
  data: Array<{ name: string; views: number; leads: number }>;
  title: string;
  description: string;
  viewsLabel: string;
  leadsLabel: string;
}

export function TopProjectsChart({
  data,
  title,
  description,
  viewsLabel,
  leadsLabel,
}: TopProjectsChartProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="views" fill="#0088FE" name={viewsLabel} />
            <Bar dataKey="leads" fill="#00C49F" name={leadsLabel} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
