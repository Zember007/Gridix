import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
}

export function TopApartmentsSection({
  data,
  title,
  description,
  apartmentLabel,
  projectLabel,
  viewsLabel,
}: TopApartmentsSectionProps) {
  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="apartment_number"
              angle={-45}
              textAnchor="end"
              height={100}
              label={{
                value: apartmentLabel,
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [value, viewsLabel]}
              labelFormatter={(label) => `${apartmentLabel} №${label}`}
            />
            <Legend />
            <Bar dataKey="views" fill="#FF8042" name={viewsLabel} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{apartmentLabel}</TableHead>
                <TableHead>{projectLabel}</TableHead>
                <TableHead>{viewsLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((apartment, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    №{apartment.apartment_number}
                  </TableCell>
                  <TableCell>{apartment.project_name}</TableCell>
                  <TableCell>{apartment.views}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
