import type { ReactNode } from "react";
import { Card, CardContent } from "@gridix/ui";

type KpiCardProps = {
  title: ReactNode;
  value: ReactNode;
  icon: ReactNode;
  className?: string;
};

export function KpiCard({ title, value, icon, className }: KpiCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex h-full items-center justify-between p-6">
        <div className="flex h-full flex-1 justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="h-8 w-8 self-center text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
