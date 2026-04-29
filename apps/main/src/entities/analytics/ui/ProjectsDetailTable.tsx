import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@gridix/ui";
import { TableProperties } from "lucide-react";
import { truncateLabel } from "../lib/utils";

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
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <CardTitle className="text-base leading-6">{title}</CardTitle>
        <CardDescription className="leading-5">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        {data.length === 0 ? (
          <DataState
            className="bg-[var(--admin-background-secondary)]/50 min-h-[250px] justify-center"
            icon={TableProperties}
            title={labels.noData}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="min-w-56">{labels.project}</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    {labels.views}
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    {labels.leads}
                  </TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    {labels.conversion}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((project, index) => {
                  const conversion =
                    project.views > 0
                      ? ((project.leads / project.views) * 100).toFixed(2)
                      : "0.00";
                  return (
                    <TableRow key={`${project.name}-${index}`}>
                      <TableCell
                        className="max-w-72 truncate font-medium"
                        title={project.name}
                      >
                        {truncateLabel(project.name, 42)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {project.views}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {project.leads}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {conversion}%
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
