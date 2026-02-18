import React from "react";
import {
  MoreVertical,
  Filter,
  Calendar,
  X,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { usePartnerAccountData } from "../queries/usePartnerAccountData";
import { PartnerTopUpModal } from "./PartnerTopUpModal";
import { WithdrawalRequestsModal } from "./WithdrawalRequestsModal";
import { useLanguage } from "@gridix/utils/react";
import { Input } from "@gridix/ui";
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";

export const PartnerAccountSection: React.FC = () => {
  const { t } = useLanguage();
  const {
    loading,
    error,
    isTopUpOpen,
    setIsTopUpOpen,
    isWithdrawalOpen,
    setIsWithdrawalOpen,
    filterType,
    setFilterType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    openMenuIndex,
    menuRef,
    toggleMenu,
    handleDownloadInvoice,
    filteredTransactions,
    resetFilters,
    hasFilters,
    accountBalance,
    commissionPercentage,
  } = usePartnerAccountData();
  const hasTransactions = filteredTransactions.length > 0;

  if (loading) {
    return (
      <div className="animate-in fade-in space-y-6 duration-500">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8 lg:w-auto lg:gap-12">
              <div>
                <div className="mb-2 h-3 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-px w-full bg-gray-100 sm:h-12 sm:w-px sm:bg-gray-200" />
              <div>
                <div className="mb-2 h-3 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 h-10 w-full animate-pulse rounded bg-gray-100" />
          <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="space-y-3 p-6">
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in space-y-6 duration-500">
      <PartnerTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />
      <WithdrawalRequestsModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
      />

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {t("partners.error")}: {error}
        </div>
      )}

      {/* Stats */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex w-full flex-col items-start gap-6 sm:flex-row sm:items-center sm:gap-8 lg:w-auto lg:gap-12">
            <div>
              <div className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                {t("partners.accountBalance")}
              </div>
              <div className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {/* Реальный доступный баланс партнёра из Supabase */}$
                {accountBalance.toFixed(2)}
              </div>
            </div>
            <div className="h-px w-full bg-gray-100 sm:h-12 sm:w-px sm:bg-gray-200" />
            <div>
              <div className="mb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                {t("partners.accountDiscount")}
              </div>
              <div className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {/* Комиссия партнёра по тем же правилам, что и calculate_and_award_partner_commission */}
                {commissionPercentage !== null
                  ? `${commissionPercentage}%`
                  : "—"}
              </div>
            </div>
          </div>
          <div className="mt-2 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 lg:mt-0 lg:w-auto">
            <button
              onClick={() => setIsWithdrawalOpen(true)}
              className="flex-1 rounded-lg border border-gray-200 px-6 py-3 text-center text-sm font-bold tracking-wider text-gray-500 uppercase transition-colors hover:border-gray-200 hover:bg-gray-100 hover:text-gray-800 sm:border-transparent lg:flex-none"
            >
              {t("partners.withdrawMoney")}
            </button>
            {/*     <button
              onClick={() => setIsTopUpOpen(true)}
              className="flex-1 lg:flex-none py-3 px-8 rounded-lg bg-[#4CAF50] hover:bg-[#43A047] text-white text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all uppercase tracking-wider flex justify-center items-center gap-2 text-center"
            >
              <ArrowDownCircle size={18} />
              {t('partners.topUp')}
            </button> */}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row">
        <div className="flex w-full flex-col items-center gap-3 lg:w-auto lg:flex-row">
          <div className="relative w-full lg:w-56">
            <Filter
              size={16}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            />
            <ShadcnSelect
              value={filterType}
              onValueChange={(value) => setFilterType(value)}
            >
              <SelectTrigger className="w-full border-gray-200 bg-gray-50 pl-9">
                <SelectValue
                  placeholder={t("partners.transactionsFilterAll")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("partners.transactionsFilterAll")}
                </SelectItem>
                <SelectItem value="income">
                  {t("partners.transactionsFilterIncome")}
                </SelectItem>
                <SelectItem value="expense">
                  {t("partners.transactionsFilterExpense")}
                </SelectItem>
                <SelectItem value="commission">
                  {t("partners.transactionsFilterCommission")}
                </SelectItem>
              </SelectContent>
            </ShadcnSelect>
          </div>
          <div className="flex w-full items-center gap-2 lg:w-auto">
            <div className="group relative flex-1 lg:flex-none">
              <Calendar
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full cursor-pointer appearance-none rounded-lg border-gray-200 bg-gray-50 pl-10 text-sm text-gray-700 lg:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
            <span className="font-medium text-gray-400">-</span>
            <div className="group relative flex-1 lg:flex-none">
              <Calendar
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 transition-colors group-hover:text-gray-600"
              />
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full cursor-pointer appearance-none rounded-lg border-gray-200 bg-gray-50 pl-10 text-sm text-gray-700 lg:w-auto [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </div>
        </div>
        <button
          onClick={resetFilters}
          disabled={!hasFilters}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all lg:w-auto ${
            hasFilters
              ? "cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black"
              : "cursor-not-allowed bg-gray-50 text-gray-300"
          }`}
        >
          <X size={16} />
          {t("partners.transactionsReset")}
        </button>
      </div>

      {/* Table */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {hasTransactions ? (
          <div className="custom-scrollbar overflow-x-auto pb-2 sm:pb-0">
            <div className="min-w-[800px]">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="w-40 px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      {t("partners.transactionsDate")}
                    </th>
                    <th className="w-32 px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      {t("partners.transactionsAmount")}
                    </th>
                    <th className="w-32 px-6 py-4 text-right text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      {t("partners.transactionsBalance")}
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold tracking-wider text-gray-500 uppercase">
                      {t("partners.transactionsComment")}
                    </th>
                    <th className="w-12 px-4 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredTransactions.map((tx, idx) => {
                    let type: "topup" | "expense" | "commission" = "commission";
                    if (tx.sum < 0) type = "expense";
                    else if (
                      tx.comment.toLowerCase().includes("комиссия") ||
                      tx.comment.toLowerCase().includes("бонус")
                    )
                      type = "commission";

                    const rowStyles = {
                      expense:
                        "border-l-4 border-l-red-300 bg-red-50/20 hover:bg-red-50/50",
                      commission:
                        "border-l-4 border-l-emerald-400 bg-emerald-50/20 hover:bg-emerald-50/50",
                      topup:
                        "border-l-4 border-l-blue-400 bg-blue-50/20 hover:bg-blue-50/50",
                    }[type];
                    const sumStyles = {
                      expense: "text-red-600",
                      commission: "text-emerald-600",
                      topup: "text-blue-600",
                    }[type];
                    const iconConfig = {
                      expense: {
                        Icon: ArrowUpCircle,
                        bg: "bg-red-100",
                        text: "text-red-600",
                      },
                      commission: {
                        Icon: Sparkles,
                        bg: "bg-emerald-100",
                        text: "text-emerald-600",
                      },
                      topup: {
                        Icon: ArrowDownCircle,
                        bg: "bg-blue-100",
                        text: "text-blue-600",
                      },
                    }[type];
                    const IconComponent = iconConfig.Icon;

                    return (
                      <tr
                        key={idx}
                        className={`${rowStyles} group relative transition-colors`}
                      >
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-full p-2 ${iconConfig.bg} ${iconConfig.text} shrink-0`}
                            >
                              <IconComponent size={14} />
                            </div>
                            {tx.date}
                          </div>
                        </td>
                        <td
                          className={`px-6 py-4 text-right text-sm font-bold whitespace-nowrap ${sumStyles}`}
                        >
                          {tx.sum > 0
                            ? `+ $${tx.sum}`
                            : `- $${Math.abs(tx.sum)}`}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm whitespace-nowrap text-gray-500">
                          $ {tx.balance.toFixed(2)}
                        </td>
                        <td
                          className="max-w-xs truncate px-6 py-4 text-sm text-gray-700 sm:max-w-md md:max-w-xl"
                          title={tx.comment}
                        >
                          {tx.comment}
                        </td>
                        <td className="relative px-4 py-4 text-center">
                          <button
                            onClick={(e) => toggleMenu(idx, e)}
                            className={`rounded-full p-1 transition-colors ${
                              openMenuIndex === idx
                                ? "bg-gray-100 text-gray-900"
                                : "text-gray-300 hover:text-gray-600"
                            }`}
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openMenuIndex === idx && (
                            <div
                              ref={menuRef}
                              className="animate-in fade-in zoom-in-95 absolute top-1/2 right-8 z-20 w-48 origin-right -translate-y-1/2 rounded-lg border border-gray-100 bg-white shadow-xl duration-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={handleDownloadInvoice}
                                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50 hover:text-black"
                              >
                                {t("partners.transactionsDownloadInvoice")}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center p-12 text-center text-gray-500">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <Filter size={20} className="text-gray-400" />
            </div>
            <span>{t("partners.transactionsNoData")}</span>
            <button
              onClick={resetFilters}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              {t("partners.transactionsResetFilters")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
