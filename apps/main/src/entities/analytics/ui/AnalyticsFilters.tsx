import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { Calendar } from "lucide-react";
import type { DateRange } from "../model/types";

interface AnalyticsFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  selectedProject: string;
  onProjectChange: (value: string) => void;
  projects: Array<{ id: string; name: string }>;
  t: (key: string) => string;
  withCard?: boolean;
}

export function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  selectedProject,
  onProjectChange,
  projects,
  t,
  withCard = true,
}: AnalyticsFiltersProps) {
  const filtersContent = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("admin.analytics.period")}
        </label>
        <Select
          value={dateRange}
          onValueChange={(value: DateRange) => onDateRangeChange(value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">
              {t("admin.analytics.periods.7days")}
            </SelectItem>
            <SelectItem value="30">
              {t("admin.analytics.periods.30days")}
            </SelectItem>
            <SelectItem value="90">
              {t("admin.analytics.periods.90days")}
            </SelectItem>
            <SelectItem value="all">
              {t("admin.analytics.periods.all")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("admin.analytics.dateFrom")}
        </label>
        <div className="relative">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-black" />
          </span>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("admin.analytics.dateTo")}
        </label>
        <div className="relative">
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-black" />
          </span>
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("admin.analytics.project")}
        </label>
        <Select value={selectedProject} onValueChange={onProjectChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t("admin.analytics.allProjects")}
            </SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  if (!withCard) {
    return filtersContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.analytics.filters")}</CardTitle>
      </CardHeader>
      <CardContent>{filtersContent}</CardContent>
    </Card>
  );
}
