import { Skeleton } from "@gridix/ui";

export function AdminWidgetsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="min-h-[200px] w-full rounded-lg" />
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-10 w-full max-w-xl" />
      </div>
    </div>
  );
}
