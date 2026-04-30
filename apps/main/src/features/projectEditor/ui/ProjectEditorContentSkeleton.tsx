import { Card, CardContent, CardHeader, Skeleton } from "@gridix/ui";

const GENPLAN_HIDDEN_TABS = [
  "apartments",
  "floors",
  "photos",
  "fields",
] as const;

export type ProjectApartmentsSkeletonProjectType =
  | "building"
  | "object"
  | null
  | undefined;

function ApartmentFloorRowSkeleton({
  projectType,
}: {
  projectType?: ProjectApartmentsSkeletonProjectType;
}) {
  const showFloorHeaders = projectType !== "object";
  return (
    <div className="space-y-2">
      {showFloorHeaders ? (
        <div className="flex items-center gap-3 py-2">
          <div className="flex-1 border-t border-border/80" />
          <Skeleton className="h-6 w-28" />
          <div className="flex-1 border-t border-border/80" />
        </div>
      ) : null}
      {Array.from({ length: 2 }, (_, apt) => (
        <Card key={apt}>
          <CardContent className="relative p-4 pt-10 sm:p-4 sm:pt-4">
            <div className="space-y-3">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-7 w-[150px] max-w-[55vw]" />
                    <Skeleton className="h-6 w-[4.5rem] rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-56 max-w-full sm:w-64" />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:gap-8">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProjectApartmentsTabSkeleton({
  projectType,
}: {
  projectType?: ProjectApartmentsSkeletonProjectType;
} = {}) {
  const isObject = projectType === "object";
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="space-y-2">
              <Skeleton className="h-7 w-48 max-w-[min(100%,16rem)]" />
              <Skeleton className="h-4 w-[min(100%,22rem)] max-w-full" />
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto lg:flex-row lg:items-stretch">
              <Skeleton className="h-[3.25rem] w-full shrink-0 rounded-md sm:min-h-[3.25rem] lg:h-auto lg:min-h-[3.25rem] lg:w-[12.5rem]" />
              {!isObject ? (
                <Skeleton className="h-10 w-full rounded-md lg:w-40" />
              ) : null}
              <Skeleton className="h-10 w-full rounded-md lg:w-[11rem]" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex min-w-0 items-center gap-2">
            <Skeleton className="h-10 flex-1 rounded-md" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <div className="space-y-4">
            <ApartmentFloorRowSkeleton projectType={projectType} />
            <ApartmentFloorRowSkeleton projectType={projectType} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BasicBuildingSkeleton({
  showBuildingTabPill,
}: {
  showBuildingTabPill: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="mb-6 hidden gap-2 lg:flex">
        <Skeleton className="h-10 w-44 rounded-md" />
        {showBuildingTabPill ? (
          <Skeleton className="h-10 w-48 rounded-md" />
        ) : null}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-1.5 h-4 w-full max-w-xl" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
          <Skeleton className="h-24 w-full rounded-md" />
        </CardContent>
      </Card>
    </div>
  );
}

function GenericTabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-[min(100%,14rem)]" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      {Array.from({ length: 3 }, (_, section) => (
        <Card key={section}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="mt-1.5 h-4 w-full max-w-md" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }, (_, row) => (
              <Skeleton key={row} className="h-4 w-full max-w-2xl" />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ProjectEditorContentSkeletonProps {
  activeTab: string;
  hasMasterplan: boolean;
  editorScopeKind?: "building" | "object";
}

export function ProjectEditorContentSkeleton({
  activeTab,
  hasMasterplan,
  editorScopeKind = "building",
}: ProjectEditorContentSkeletonProps) {
  const normalizedTab =
    hasMasterplan &&
    GENPLAN_HIDDEN_TABS.includes(
      activeTab as (typeof GENPLAN_HIDDEN_TABS)[number],
    )
      ? "basic"
      : activeTab;

  if (normalizedTab === "apartments") {
    return <ProjectApartmentsTabSkeleton projectType={editorScopeKind} />;
  }

  if (normalizedTab === "basic" || normalizedTab === "building") {
    return <BasicBuildingSkeleton showBuildingTabPill={!hasMasterplan} />;
  }

  return <GenericTabSkeleton />;
}
