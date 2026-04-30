import { Skeleton } from "@gridix/ui";

export function CrmProjectConfigListSkeleton({
  rowCount = 4,
}: {
  rowCount?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {Array.from({ length: rowCount }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors"
          >
            <div className="flex flex-1 items-center gap-4">
              <Skeleton className="h-5 w-10 shrink-0 rounded-full" />
              <div className="flex flex-col gap-2 py-0.5">
                <Skeleton className="h-4 w-[min(200px,50vw)]" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
