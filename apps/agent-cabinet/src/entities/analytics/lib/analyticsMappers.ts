import type { AnalyticsCrmData, AnalyticsFinanceData } from "../model/types";

export function mapAnalyticsCrm(
  data: Record<string, unknown> | undefined,
): AnalyticsCrmData {
  const salesData = data?.sales as Record<string, unknown> | undefined;
  return {
    leadsCount: Number(salesData?.leads_count ?? 0),
    byStage: (salesData?.by_stage ?? []) as Array<{
      id: string;
      name: string;
      count: number;
    }>,
    bySource: (salesData?.by_source ?? []) as Array<{
      source: string;
      count: number;
    }>,
    conversionRate: Number(salesData?.conversion_rate ?? 5.5),
  };
}

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
