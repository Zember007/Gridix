import { useLayoutEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Eye,
  Home,
  SlidersHorizontal,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspaceProjects } from "@/entities/workspace/queries/useWorkspaceProjects";
import Spinner from "@/shared/ui/Spinner";
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

function getScrollParent(startEl: HTMLElement | null): HTMLElement | null {
  let el = startEl?.parentElement ?? null;
  while (el) {
    const { overflowY, overflow } = getComputedStyle(el);
    const oy = overflowY || overflow;
    if (/(auto|scroll|overlay)/.test(oy)) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
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
  const [isFiltersCompact, setIsFiltersCompact] = useState(false);
  const analyticsRootRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    if (!(adminAccess?.canViewAnalytics ?? false)) return;
    if (isLoading || queryError) return;

    const scrollEl = getScrollParent(analyticsRootRef.current);
    const target: HTMLElement | Window = scrollEl ?? window;

    const getScrollTop = () =>
      target === window
        ? window.scrollY || document.documentElement.scrollTop
        : (target as HTMLElement).scrollTop;

    const handleScroll = () => {
      setIsFiltersCompact(getScrollTop() > 80);
    };

    handleScroll();
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [adminAccess?.canViewAnalytics, isLoading, queryError]);

  if (!(adminAccess?.canViewAnalytics ?? false)) {
    return <AdminAccessNotice variant="subscription" />;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (queryError) {
    const msg =
      queryError instanceof Error
        ? queryError.message
        : t("admin.analytics.loading");

    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              {msg}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div ref={analyticsRootRef} className="space-y-6">
      <div className="flex min-h-[2.75rem] justify-end">
        {!isFiltersCompact ? (
          <Button
            variant="outline"
            className="relative rounded-full px-4"
            onClick={() => {
              syncDraftFromApplied();
              setFiltersOpen(true);
            }}
            aria-label={t("admin.analytics.filters")}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            {t("admin.analytics.filters")}
            {appliedFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--admin-primary)] px-1 text-[10px] font-semibold text-[var(--admin-text-on-primary)]">
                {appliedFiltersCount}
              </span>
            )}
          </Button>
        ) : (
          <div className="h-11 shrink-0" aria-hidden />
        )}
      </div>
      {isFiltersCompact && (
        <div className="pointer-events-none fixed right-8 top-3 z-40 md:right-6">
          <Button
            variant="outline"
            className="pointer-events-auto relative h-11 w-11 rounded-full p-0 shadow-sm"
            onClick={() => {
              syncDraftFromApplied();
              setFiltersOpen(true);
            }}
            aria-label={t("admin.analytics.filters")}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {appliedFiltersCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--admin-primary)] px-1 text-[10px] font-semibold text-[var(--admin-text-on-primary)]">
                {appliedFiltersCount}
              </span>
            )}
          </Button>
        </div>
      )}
      <Dialog
        open={filtersOpen}
        onOpenChange={(open) => {
          if (open) {
            syncDraftFromApplied();
          }
          setFiltersOpen(open);
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("admin.analytics.filters")}</DialogTitle>
          </DialogHeader>
          <AnalyticsFilters
            dateRange={draftDateRange}
            onDateRangeChange={setDraftDateRange}
            dateFrom={draftDateFrom}
            onDateFromChange={setDraftDateFrom}
            dateTo={draftDateTo}
            onDateToChange={setDraftDateTo}
            selectedProject={draftSelectedProject}
            onProjectChange={setDraftSelectedProject}
            projects={
              activeProjects.length > 0 ? activeProjects : workspaceProjects
            }
            t={t}
            withCard={false}
          />
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-slate-200"
              onClick={handleResetDraftFilters}
            >
              {t("admin.analytics.resetFilters")}
            </Button>
            <Button
              type="button"
              onClick={handleApplyFilters}
              className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-bold text-[var(--admin-text-on-primary)] shadow-sm transition-all hover:bg-[var(--admin-primary-hover)] active:scale-95 active:bg-[var(--admin-primary-active)]"
            >
              {t("admin.analytics.applyFilters")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        />
        <LeadsChart
          data={analyticsData.leads}
          title={t("admin.analytics.leads")}
          description={t("admin.analytics.leadsDescription")}
        />
      </div>

      <TopProjectsChart
        data={analyticsData.topProjects}
        title={t("admin.analytics.topProjects")}
        description={t("admin.analytics.topProjectsDescription")}
        viewsLabel={t("admin.analytics.views")}
        leadsLabel={t("admin.analytics.leads")}
      />

      <TopApartmentsSection
        data={analyticsData.topApartments}
        title={t("admin.analytics.topApartments")}
        description={t("admin.analytics.topApartmentsDescription")}
        apartmentLabel={t("admin.analytics.apartment")}
        projectLabel={t("admin.analytics.project")}
        viewsLabel={t("admin.analytics.views")}
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
