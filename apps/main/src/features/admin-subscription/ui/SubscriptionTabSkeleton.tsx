import { Skeleton } from "@gridix/ui";

export function SubscriptionTabSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 pb-20">
      <section className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-44" />
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="min-h-[200px] rounded-xl" />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-40 w-full rounded-xl border border-slate-100" />
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-52 w-full rounded-xl border border-slate-200" />
      </section>
    </div>
  );
}
