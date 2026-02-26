import type { DashboardActivityItem, DashboardMetrics } from "../model/types";

export function mapDashboardMetrics(
  data: Record<string, unknown> | undefined,
): DashboardMetrics {
  return {
    leads: Number((data?.leads as Record<string, unknown>)?.count ?? 0),
    contacts: Number((data?.contacts as Record<string, unknown>)?.count ?? 0),
    paid: Number((data?.payouts as Record<string, unknown>)?.paid ?? 0),
    pending: Number((data?.payouts as Record<string, unknown>)?.pending ?? 0),
    projects: Number((data?.projects as Record<string, unknown>)?.count ?? 0),
  };
}

export function buildRevenueData(paid: number): number[] {
  const base = paid || 1000;
  return [base * 0.3, base * 0.5, base * 0.4, base * 0.7, base * 0.6, base];
}

export function buildActivities(
  metrics: DashboardMetrics,
  t: (key: string, vars?: unknown) => string,
): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];
  if (metrics.leads > 0) {
    items.push({
      id: 1,
      user: t("common.dashboard.activity.system"),
      action: t("common.dashboard.activity.newLead"),
      target: `${metrics.leads} ${t("common.dashboard.activity.leadsLabel")}`,
      time: t("common.dashboard.activity.recent"),
      type: "info",
    });
  }
  if (metrics.paid > 0) {
    items.push({
      id: 2,
      user: t("common.dashboard.activity.system"),
      action: t("common.dashboard.activity.commissionPaid"),
      target: `$${metrics.paid.toLocaleString()}`,
      time: t("common.dashboard.activity.thisMonth"),
      type: "success",
    });
  }
  if (metrics.pending > 0) {
    items.push({
      id: 3,
      user: t("common.dashboard.activity.system"),
      action: t("common.dashboard.activity.pendingPayout"),
      target: `$${metrics.pending.toLocaleString()}`,
      time: t("common.dashboard.activity.inPipeline"),
      type: "warning",
    });
  }
  return items;
}
