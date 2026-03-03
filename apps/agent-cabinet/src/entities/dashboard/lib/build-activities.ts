import type { DashboardActivityItem, DashboardMetrics } from "../model/types";

/**
 * Builds localized activity feed items from dashboard metrics.
 *
 * @param metrics Normalized dashboard metrics.
 * @param t Translation function.
 * @returns Activity feed items for dashboard timeline.
 */
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
