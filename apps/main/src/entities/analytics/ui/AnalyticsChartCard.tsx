import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataState,
} from "@gridix/ui";
import { cn } from "@gridix/utils/lib";
import { BarChart3 } from "lucide-react";

type AnalyticsChartCardProps = {
  title: ReactNode;
  description?: ReactNode;
  isEmpty?: boolean;
  emptyLabel?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function AnalyticsChartCard({
  title,
  description,
  isEmpty = false,
  emptyLabel,
  className,
  children,
}: AnalyticsChartCardProps) {
  return (
    <Card
      className={cn(
        "hover:border-[var(--admin-primary)]/20 overflow-hidden transition-[border-color,box-shadow] duration-200 hover:shadow-[0_14px_34px_rgba(23,23,23,0.05)]",
        className,
      )}
    >
      <CardHeader className="p-4 pb-3 sm:p-5 sm:pb-3">
        <CardTitle className="text-base leading-6">{title}</CardTitle>
        {description ? (
          <CardDescription className="leading-5">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        {isEmpty ? (
          <DataState
            className="bg-[var(--admin-background-secondary)]/50 min-h-[260px] justify-center border-dashed"
            icon={BarChart3}
            title={emptyLabel}
          />
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

type AnalyticsTooltipPayload = {
  name?: string | number;
  value?: string | number;
  color?: string;
};

type AnalyticsTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: AnalyticsTooltipPayload[];
};

export function AnalyticsTooltip({
  active,
  label,
  payload,
}: AnalyticsTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-lg border border-border/80 bg-card px-3 py-2 text-sm shadow-[0_12px_32px_rgba(23,23,23,0.12)]">
      {label ? (
        <div className="mb-2 max-w-48 truncate text-xs font-medium text-muted-foreground">
          {label}
        </div>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={`${item.name ?? "value"}-${item.value ?? ""}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
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
  );
}
