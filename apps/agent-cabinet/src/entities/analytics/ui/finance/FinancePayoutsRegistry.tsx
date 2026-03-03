import { Download } from "lucide-react";
import type { AnalyticsFinanceData } from "../../model/types";
import { FinancePayoutStatusBadge } from "./FinancePayoutStatusBadge";

interface Props {
  payouts: AnalyticsFinanceData["payouts"];
  t: (key: string) => string;
}

export function FinancePayoutsRegistry({ payouts, t }: Props) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6">
        <h3 className="text-sm font-bold text-slate-900">
          {t("common.analytics.finance.registry")}
        </h3>
        <button
          type="button"
          aria-label={t("common.analytics.finance.export")}
          className="flex shrink-0 items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900"
        >
          <Download size={14} />
          <span className="hidden sm:inline">
            {t("common.analytics.finance.export")}
          </span>
        </button>
      </div>

      <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain">
        {payouts.length ? (
          <table className="w-full min-w-[480px] text-left">
            <thead className="bg-slate-50/50 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                  {t("common.analytics.finance.colAmount")}
                </th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                  {t("common.analytics.finance.colProject")}
                </th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                  {t("common.analytics.finance.colDate")}
                </th>
                <th className="whitespace-nowrap px-3 py-3 sm:px-6">
                  {t("common.analytics.finance.colStatus")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {payouts.slice(0, 30).map((payout) => (
                <tr
                  key={payout.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-3 py-4 font-mono font-bold text-slate-900 sm:px-6">
                    ${Number(payout.amount ?? 0).toLocaleString()}
                  </td>
                  <td className="px-3 py-4 text-slate-700 sm:px-6">
                    <div className="max-w-[220px] truncate">
                      {payout.project_name ?? t("common.common.empty")}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-slate-500 sm:px-6">
                    {payout.payout_date
                      ? new Date(payout.payout_date).toLocaleDateString()
                      : t("common.common.empty")}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                    <FinancePayoutStatusBadge status={payout.status} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center text-sm text-slate-500">
            {t("common.analytics.finance.noPayouts")}
          </div>
        )}
      </div>
    </div>
  );
}
