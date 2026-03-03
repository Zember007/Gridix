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

interface ProjectsDetailTableProps {
  data: Array<{ name: string; views: number; leads: number }>;
  title: string;
  description: string;
  labels: {
    project: string;
    views: string;
    leads: string;
    conversion: string;
    noData: string;
  };
}

export function ProjectsDetailTable({
  data,
  title,
  description,
  labels,
}: ProjectsDetailTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{labels.project}</TableHead>
              <TableHead>{labels.views}</TableHead>
              <TableHead>{labels.leads}</TableHead>
              <TableHead>{labels.conversion}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((project, index) => {
              const conversion =
                project.views > 0
                  ? ((project.leads / project.views) * 100).toFixed(2)
                  : "0.00";
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.views}</TableCell>
                  <TableCell>{project.leads}</TableCell>
                  <TableCell>{conversion}%</TableCell>
                </TableRow>
              );
            })}
            {data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  {labels.noData}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
