export interface AnalyticsCrmData {
  leadsCount: number;
  byStage: Array<{ id: string; name: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  conversionRate: number;
}

export interface AnalyticsFinanceData {
  paid: number;
  pending: number;
  payoutCount: number;
  payouts: Array<{
    id: string;
    amount?: number;
    payout_date?: string;
    status?: string;
    project_name?: string;
  }>;
}
