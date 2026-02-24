export type {
  AnalyticsData,
  DateRange,
  AnalyticsFiltersState,
} from "./model/types";
export { CHART_COLORS, EMPTY_ANALYTICS } from "./model/types";

export {
  truncateLabel,
  safeNumber,
  normalizeAnalyticsResponse,
} from "./lib/utils";

export { fetchAdminAnalytics } from "./api/analyticsApi";
export { useAdminAnalyticsQuery } from "./queries/useAdminAnalyticsQuery";

export { AnalyticsFilters } from "./ui/AnalyticsFilters";
export { ViewsChart } from "./ui/ViewsChart";
export { LeadsChart } from "./ui/LeadsChart";
export { TopProjectsChart } from "./ui/TopProjectsChart";
export { TopApartmentsSection } from "./ui/TopApartmentsSection";
export { ApartmentStatsCard } from "./ui/ApartmentStatsCard";
export { ProjectsDetailTable } from "./ui/ProjectsDetailTable";
