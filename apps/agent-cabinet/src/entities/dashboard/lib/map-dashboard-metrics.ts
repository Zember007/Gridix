import type { DashboardMetrics } from "../model/types";

/**
 * Maps raw dashboard response into a normalized metrics object.
 *
 * @param data Raw dashboard payload from API.
 * @returns Normalized dashboard metrics with numeric values.
 */
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
