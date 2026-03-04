/**
 * Builds a synthetic revenue trend series for dashboard charts.
 *
 * @param paid Paid commission amount.
 * @returns Revenue data points for chart rendering.
 */
export function buildRevenueData(paid: number): number[] {
  const base = paid || 1000;
  return [base * 0.3, base * 0.5, base * 0.4, base * 0.7, base * 0.6, base];
}
