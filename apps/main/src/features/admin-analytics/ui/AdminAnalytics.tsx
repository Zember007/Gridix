import { useEffect, useState } from "react";
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

export const AdminAnalytics = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { projects: workspaceProjects } = useWorkspaceProjects();
  const adminAccess = useAdminAccess();
  const activeProjects = adminAccess?.activeProjects ?? [];

  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isFiltersCompact, setIsFiltersCompact] = useState(false);
  const appliedFiltersCount =
    Number(dateRange !== "all") +
    Number(Boolean(dateFrom)) +
    Number(Boolean(dateTo)) +
    Number(selectedProject !== "all");

  useEffect(() => {
    const handleScroll = () => {
      setIsFiltersCompact(window.scrollY > 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
    <div className="space-y-6">
      <div
        className={
          isFiltersCompact
            ? "pointer-events-none fixed right-4 top-20 z-40 md:right-6"
            : "flex justify-end"
        }
      >
        <Button
          variant="outline"
          className={
            isFiltersCompact
              ? "pointer-events-auto relative h-11 w-11 rounded-full p-0 shadow-sm"
              : "relative rounded-full px-4"
          }
          onClick={() => setFiltersOpen(true)}
          aria-label={t("admin.analytics.filters")}
        >
          <SlidersHorizontal
            className={isFiltersCompact ? "h-4 w-4" : "mr-2 h-4 w-4"}
          />
          {!isFiltersCompact && t("admin.analytics.filters")}
          {appliedFiltersCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--admin-primary)] px-1 text-[10px] font-semibold text-[var(--admin-text-on-primary)]">
              {appliedFiltersCount}
            </span>
          )}
        </Button>
      </div>
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{t("admin.analytics.filters")}</DialogTitle>
          </DialogHeader>
          <AnalyticsFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            projects={
              activeProjects.length > 0 ? activeProjects : workspaceProjects
            }
            t={t}
            withCard={false}
          />
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
