import { ArrowUpRight, Download, Wallet } from "lucide-react";
import type { AnalyticsFinanceData } from "../model/types";

interface Props extends AnalyticsFinanceData {
  t: (key: string) => string;
}

export function FinanceView({ paid, pending, payoutCount, payouts, t }: Props) {
  return (
    <div className="min-w-0 space-y-6 duration-500 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="mt-0.5 shrink-0 rounded-lg border border-slate-100 bg-white p-2 text-slate-600">
          <Wallet size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-slate-900">
            {t("common.analytics.finance.registryTitle")}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {t("common.analytics.finance.registryDescription")}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.finance.pipeline")}
            </p>
            <div className="flex shrink-0 items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
              <ArrowUpRight size={10} />
              {t("common.analytics.finance.inProgress")}
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            ${pending.toLocaleString()}
          </h3>
          <span className="mt-1 block text-xs text-slate-500">
            {payoutCount} {t("common.analytics.finance.dealsInWork")}
          </span>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.finance.received")}
            </p>
            <div className="flex shrink-0 items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600">
              <ArrowUpRight size={10} />
              {t("common.analytics.finance.success")}
            </div>
          </div>
          <h3 className="text-2xl font-black text-green-600">
            ${paid.toLocaleString()}
          </h3>
          <span className="mt-1 block text-xs text-slate-500">
            {t("common.analytics.finance.successDeals")}
          </span>
        </div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex min-w-0 items-start justify-between gap-2">
            <p className="min-w-0 break-words text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("common.analytics.finance.total")}
            </p>
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            ${(paid + pending).toLocaleString()}
          </h3>
          <span className="mt-1 block text-xs text-slate-500">
            {t("common.analytics.finance.allTime")}
          </span>
        </div>
      </div>
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
                {payouts.slice(0, 30).map((p) => (
                  <tr
                    key={p.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-3 py-4 font-mono font-bold text-slate-900 sm:px-6">
                      ${Number(p.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-4 text-slate-700 sm:px-6">
                      <div className="max-w-[220px] truncate">
                        {p.project_name ?? t("common.common.empty")}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-slate-500 sm:px-6">
                      {p.payout_date
                        ? new Date(p.payout_date).toLocaleDateString()
                        : t("common.common.empty")}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 sm:px-6">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold ${String(p.status) === "paid" ? "bg-green-50 text-green-700" : String(p.status) === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700"}`}
                      >
                        {String(p.status) === "paid"
                          ? t("common.analytics.finance.statusPaid")
                          : String(p.status) === "pending"
                            ? t("common.analytics.finance.statusPending")
                            : String(p.status)}
                      </span>
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
    </div>
  );
}
