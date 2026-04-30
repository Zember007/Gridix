import { Card, Skeleton } from "@gridix/ui";
import { cn } from "@gridix/utils/lib";

/** Matches CRM integration card chrome (accent bar, logo, badge, body). */
export function CrmConnectionCardSkeleton({ barClass }: { barClass: string }) {
  return (
    <Card className="flex flex-col overflow-hidden border-none shadow-md transition-all duration-300">
      <div className={cn("h-2 w-full", barClass)} />
      <div className="space-y-3 p-6">
        <div className="flex items-start justify-between">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-[90%]" />
        <div className="space-y-3 pt-2">
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </Card>
  );
}
