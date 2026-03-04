import type { AnalyticsFinanceData } from "../model/types";

/**
 * Normalizes raw analytics payload into finance metrics used by the UI.
 * Falls back to safe defaults when payload fields are missing.
 */
export function mapAnalyticsFinance(
  data: Record<string, unknown> | undefined,
): AnalyticsFinanceData {
  const financeData = data?.finance as Record<string, unknown> | undefined;
  const stats = financeData?.stats as Record<string, unknown> | undefined;

  return {
    paid: Number(stats?.paid ?? 0),
    pending: Number(stats?.pending ?? 0),
    payoutCount: Number(stats?.count ?? 0),
    payouts: (financeData?.payouts ?? []) as AnalyticsFinanceData["payouts"],
  };
}
