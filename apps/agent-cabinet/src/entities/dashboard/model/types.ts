export interface DashboardMetrics {
  leads: number;
  contacts: number;
  paid: number;
  pending: number;
  projects: number;
}

export interface DashboardActivityItem {
  id: number;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "success" | "info" | "warning";
}
