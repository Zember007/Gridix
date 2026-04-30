import { useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  Eye,
  Home,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button, Card, CardContent, DataState, Skeleton } from "@gridix/ui";
import { cn } from "@gridix/utils/lib";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceProjects } from "@/entities/workspace/queries/useWorkspaceProjects";
import { KpiCard } from "@/shared/ui/KpiCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminAccess } from "@/entities/admin-access";
import { AdminAccessNotice } from "@/shared/ui/AdminAccessNotice";
import {
  type DateRange,
  EMPTY_ANALYTICS,
  useAdminAnalyticsQuery,
  AnalyticsFilters,
  ViewsChart,
  LeadsChart,
  TopProjectsChart,
  TopApartmentsSection,
  ApartmentStatsCard,
  ProjectsDetailTable,
} from "@/entities/analytics";

const KPI_SKELETONS = ["views", "leads", "conversion", "apartments"];

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 border-b border-[var(--admin-border-light)] pb-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-11 w-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_SKELETONS.map((item) => (
          <Card key={item}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex min-h-24 items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px] rounded-lg" />
        <Skeleton className="h-[380px] rounded-lg" />
      </div>
      <Skeleton className="h-[430px] rounded-lg" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-[380px] rounded-lg" />
        <Skeleton className="h-[380px] rounded-lg" />
      </div>
    </div>
  );
}

export const AdminAnalytics = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { projects: workspaceProjects } = useWorkspaceProjects();
  const adminAccess = useAdminAccess();
  const activeProjects = adminAccess?.activeProjects ?? [];

  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [draftDateRange, setDraftDateRange] = useState<DateRange>("all");
  const [draftSelectedProject, setDraftSelectedProject] =
    useState<string>("all");
  const [draftDateFrom, setDraftDateFrom] = useState<string>("");
  const [draftDateTo, setDraftDateTo] = useState<string>("");
  const appliedFiltersCount =
    Number(dateRange !== "all") +
    Number(Boolean(dateFrom)) +
    Number(Boolean(dateTo)) +
    Number(selectedProject !== "all");

  const {
    data: analyticsDataRaw,
    isLoading,
    error: queryError,
  } = useAdminAnalyticsQuery({
    userId: user?.id,
    isManagerMode,
    activeWorkspaceId,
    dateRange,
    selectedProject,
    dateFrom,
    dateTo,
    enabled: Boolean(user && userRole.type !== "loading"),
  });

  const analyticsData = analyticsDataRaw ?? EMPTY_ANALYTICS;
  const filterProjects =
    activeProjects.length > 0 ? activeProjects : workspaceProjects;

  const syncDraftFromApplied = () => {
    setDraftDateRange(dateRange);
    setDraftDateFrom(dateFrom);
    setDraftDateTo(dateTo);
    setDraftSelectedProject(selectedProject);
  };

  const handleApplyFilters = () => {
    setDateRange(draftDateRange);
    setDateFrom(draftDateFrom);
    setDateTo(draftDateTo);
    setSelectedProject(draftSelectedProject);
    setFiltersOpen(false);
  };

  const handleResetDraftFilters = () => {
    setDraftDateRange("all");
    setDraftDateFrom("");
    setDraftDateTo("");
    setDraftSelectedProject("all");
  };

  const handleResetAppliedFilters = () => {
    setDateRange("all");
    setDateFrom("");
    setDateTo("");
    setSelectedProject("all");
    setDraftDateRange("all");
    setDraftDateFrom("");
    setDraftDateTo("");
    setDraftSelectedProject("all");
  };

  const periodLabel =
    dateRange === "7"
      ? t("admin.analytics.periods.7days")
      : dateRange === "30"
        ? t("admin.analytics.periods.30days")
        : dateRange === "90"
          ? t("admin.analytics.periods.90days")
          : t("admin.analytics.periods.all");
  const selectedProjectLabel =
    selectedProject === "all"
      ? t("admin.analytics.allProjects")
      : (filterProjects.find((project) => project.id === selectedProject)
          ?.name ?? t("admin.analytics.allProjects"));
  const dateLabel =
    dateFrom || dateTo ? `${dateFrom || "..."} -> ${dateTo || "..."}` : null;
  const summaryLabel = [periodLabel, selectedProjectLabel, dateLabel]
    .filter(Boolean)
    .join(" / ");

  if (!(adminAccess?.canViewAnalytics ?? false)) {
    return <AdminAccessNotice variant="subscription" />;
  }

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  if (queryError) {
    const msg =
      queryError instanceof Error
        ? queryError.message
        : t("admin.analytics.loading");

    return (
      <div className="space-y-6">
        <div className="border-b border-[var(--admin-border-light)] pb-5">
          <h1 className="text-2xl font-semibold leading-8 text-[var(--admin-text-primary)]">
            {t("admin.analytics.title")}
          </h1>
          <p className="mt-1 max-w-[72ch] text-sm leading-6 text-[var(--admin-text-muted)]">
            {t("admin.analyticsDescription")}
          </p>
        </div>
        <DataState
          variant="error"
          icon={AlertCircle}
          title={msg}
          description={t("admin.analytics.loading")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-[var(--admin-border-light)] pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-8 text-[var(--admin-text-primary)]">
              {t("admin.analytics.title")}
            </h1>
            <p className="mt-1 max-w-[72ch] text-sm leading-6 text-[var(--admin-text-muted)]">
              {t("admin.analyticsDescription")}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--admin-border-light)] bg-[var(--admin-background-secondary)] px-3 py-2 text-sm text-[var(--admin-text-secondary)]">
            <span className="font-medium text-[var(--admin-text-primary)]">
              {summaryLabel}
            </span>
          </div>
        </div>

        <div className="bg-[var(--admin-background-secondary)]/80 flex flex-col gap-3 rounded-lg border border-[var(--admin-border-light)] p-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2 px-1">
            <span className="text-sm font-medium text-[var(--admin-text-primary)]">
              {t("admin.analytics.filters")}
            </span>
            {appliedFiltersCount > 0 && (
              <span className="bg-[var(--admin-primary)]/10 rounded-md px-2 py-1 text-xs font-semibold text-[var(--admin-primary)]">
                {appliedFiltersCount}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {appliedFiltersCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]"
                onClick={handleResetAppliedFilters}
              >
                {t("admin.analytics.resetFilters")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="hover:border-[var(--admin-primary)]/30 relative bg-[var(--admin-card-background)] transition-[background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.98]"
              onClick={() => {
                if (!filtersOpen) {
                  syncDraftFromApplied();
                }
                setFiltersOpen((open) => !open);
              }}
              aria-label={t("admin.analytics.filters")}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t("admin.analytics.filters")}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  filtersOpen && "rotate-180",
                )}
              />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
            filtersOpen
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="min-h-0 overflow-hidden">
            <Card className="border-[var(--admin-border-light)] bg-[var(--admin-card-background)] shadow-none">
              <CardContent className="space-y-4 p-4">
                <AnalyticsFilters
                  dateRange={draftDateRange}
                  onDateRangeChange={setDraftDateRange}
                  dateFrom={draftDateFrom}
                  onDateFromChange={setDraftDateFrom}
                  dateTo={draftDateTo}
                  onDateToChange={setDraftDateTo}
                  selectedProject={draftSelectedProject}
                  onProjectChange={setDraftSelectedProject}
                  projects={filterProjects}
                  t={t}
                  withCard={false}
                />
                <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--admin-border-light)] pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-[var(--admin-border)]"
                    onClick={handleResetDraftFilters}
                  >
                    {t("admin.analytics.resetFilters")}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleApplyFilters}
                    className="bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] shadow-sm transition-[background-color,transform] duration-200 hover:bg-[var(--admin-primary-hover)] active:scale-[0.98] active:bg-[var(--admin-primary-active)]"
                  >
                    {t("admin.analytics.applyFilters")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          value={analyticsData.totalViews}
          title={t("admin.analytics.totalViews")}
          icon={<Eye className="h-8 w-8" />}
        />
        <KpiCard
          value={analyticsData.totalLeads}
          title={t("admin.analytics.totalLeads")}
          icon={<Users className="h-8 w-8" />}
        />
        <KpiCard
          value={`${analyticsData.conversionRate.toFixed(2)}%`}
          title={t("admin.analytics.conversionRate")}
          icon={<TrendingUp className="h-8 w-8" />}
        />
        <KpiCard
          value={analyticsData.apartmentStats.total}
          title={t("admin.analytics.totalApartments")}
          icon={<Home className="h-8 w-8" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ViewsChart
          data={analyticsData.projectViews}
          title={t("admin.analytics.projectViews")}
          description={t("admin.analytics.projectViewsDescription")}
          emptyLabel={t("admin.analytics.noData")}
        />
        <LeadsChart
          data={analyticsData.leads}
          title={t("admin.analytics.leads")}
          description={t("admin.analytics.leadsDescription")}
          emptyLabel={t("admin.analytics.noData")}
        />
      </div>

      <TopProjectsChart
        data={analyticsData.topProjects}
        title={t("admin.analytics.topProjects")}
        description={t("admin.analytics.topProjectsDescription")}
        viewsLabel={t("admin.analytics.views")}
        leadsLabel={t("admin.analytics.leads")}
        emptyLabel={t("admin.analytics.noData")}
      />

      <TopApartmentsSection
        data={analyticsData.topApartments}
        title={t("admin.analytics.topApartments")}
        description={t("admin.analytics.topApartmentsDescription")}
        apartmentLabel={t("admin.analytics.apartment")}
        projectLabel={t("admin.analytics.project")}
        viewsLabel={t("admin.analytics.views")}
        emptyLabel={t("admin.analytics.noData")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ApartmentStatsCard
          stats={analyticsData.apartmentStats}
          title={t("admin.analytics.apartmentsStats")}
          description={t("admin.analytics.apartmentsStatsDescription")}
          labels={{
            available: t("admin.analytics.apartments.available"),
            sold: t("admin.analytics.apartments.sold"),
            reserved: t("admin.analytics.apartments.reserved"),
          }}
          emptyLabel={t("admin.analytics.noData")}
        />
        <ProjectsDetailTable
          data={analyticsData.topProjects}
          title={t("admin.analytics.projectsTable")}
          description={t("admin.analytics.projectsTableDescription")}
          labels={{
            project: t("admin.analytics.project"),
            views: t("admin.analytics.views"),
            leads: t("admin.analytics.leads"),
            conversion: t("admin.analytics.conversion"),
            noData: t("admin.analytics.noData"),
          }}
        />
      </div>
    </div>
  );
};
