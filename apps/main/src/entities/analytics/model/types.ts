export interface AnalyticsData {
  projectViews: Array<{ date: string; views: number }>;
  leads: Array<{ date: string; leads: number }>;
  topProjects: Array<{ name: string; views: number; leads: number }>;
  topApartments: Array<{
    apartment_number: string;
    project_name: string;
    views: number;
  }>;
  apartmentStats: {
    available: number;
    sold: number;
    reserved: number;
    total: number;
  };
  conversionRate: number;
  totalViews: number;
  totalLeads: number;
}

export const CHART_COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
];

export const EMPTY_ANALYTICS: AnalyticsData = {
  projectViews: [],
  leads: [],
  topProjects: [],
  topApartments: [],
  apartmentStats: { available: 0, sold: 0, reserved: 0, total: 0 },
  conversionRate: 0,
  totalViews: 0,
  totalLeads: 0,
};

export type DateRange = "7" | "30" | "90" | "all";

export interface AnalyticsFiltersState {
  dateRange: DateRange;
  selectedProject: string;
  dateFrom: string;
  dateTo: string;
}
