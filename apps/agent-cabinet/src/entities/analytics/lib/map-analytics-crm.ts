import type { AnalyticsCrmData } from "../model/types";

/**
 * Normalizes raw analytics payload into CRM metrics used by the UI.
 * Falls back to safe defaults when payload fields are missing.
 */
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
