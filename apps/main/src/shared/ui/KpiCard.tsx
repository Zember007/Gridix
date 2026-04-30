import type { ReactNode } from "react";
import { Card, CardContent } from "@gridix/ui";
import { cn } from "@gridix/utils/lib";

type KpiCardProps = {
  title: ReactNode;
  value: ReactNode;
  icon: ReactNode;
  className?: string;
};

export function KpiCard({ title, value, icon, className }: KpiCardProps) {
  return (
    <Card
      className={cn(
        "hover:border-[var(--admin-primary)]/25 group overflow-hidden transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(23,23,23,0.06)]",
        className,
      )}
    >
      <CardContent className="h-full p-4 sm:p-5">
        <div className="flex min-h-24 items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="line-clamp-2 text-sm font-medium leading-5 text-muted-foreground">
              {title}
            </p>
            <p className="truncate text-2xl font-semibold tabular-nums leading-8 text-foreground">
              {value}
            </p>
          </div>
          <div className="group-hover:bg-[var(--admin-primary)]/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors duration-200 group-hover:text-[var(--admin-primary)] [&_svg]:h-5 [&_svg]:w-5">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
