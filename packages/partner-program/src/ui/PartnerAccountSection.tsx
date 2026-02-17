import React from 'react';
import {
  MoreVertical,
  Filter,
  Calendar,
  X,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { usePartnerAccountData } from '../queries/usePartnerAccountData';
import { PartnerTopUpModal } from './PartnerTopUpModal';
import { WithdrawalRequestsModal } from './WithdrawalRequestsModal';
import { useLanguage } from '@gridix/utils/react';
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 lg:gap-12 w-full lg:w-auto">
              <div>
                <div className="h-3 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-px w-full sm:h-12 sm:w-px bg-gray-100 sm:bg-gray-200" />
              <div>
                <div className="h-3 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="h-10 w-full bg-gray-100 rounded mb-3 animate-pulse" />
          <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 space-y-3">
            <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PartnerTopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
      />
      <WithdrawalRequestsModal
        isOpen={isWithdrawalOpen}
        onClose={() => setIsWithdrawalOpen(false)}
      />

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3">
          {t('partners.error')}: {error}
        </div>
      )}

      {/* Stats */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 lg:gap-12 w-full lg:w-auto">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('partners.accountBalance')}
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {/* Реальный доступный баланс партнёра из Supabase */}
                ${accountBalance.toFixed(2)}
              </div>
            </div>
            <div className="h-px w-full sm:h-12 sm:w-px bg-gray-100 sm:bg-gray-200" />
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('partners.accountDiscount')}
              </div>
              <div className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {/* Комиссия партнёра по тем же правилам, что и calculate_and_award_partner_commission */}
                {commissionPercentage !== null ? `${commissionPercentage}%` : '—'}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full lg:w-auto mt-2 lg:mt-0">
            <button
              onClick={() => setIsWithdrawalOpen(true)}
              className="flex-1 lg:flex-none py-3 px-6 rounded-lg text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 uppercase tracking-wider transition-colors border border-gray-200 sm:border-transparent hover:border-gray-200 text-center"
            >
              {t('partners.withdrawMoney')}
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
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full lg:w-56">
            <Filter
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <ShadcnSelect
              value={filterType}
              onValueChange={(value) => setFilterType(value)}
            >
              <SelectTrigger className="w-full bg-gray-50 border-gray-200 pl-9">
                <SelectValue
                  placeholder={t('partners.transactionsFilterAll')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('partners.transactionsFilterAll')}
                </SelectItem>
                <SelectItem value="income">
                  {t('partners.transactionsFilterIncome')}
                </SelectItem>
                <SelectItem value="expense">
                  {t('partners.transactionsFilterExpense')}
                </SelectItem>
                <SelectItem value="commission">
                  {t('partners.transactionsFilterCommission')}
                </SelectItem>
              </SelectContent>
            </ShadcnSelect>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none group">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none"
              />
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => (e.currentTarget).showPicker?.()}
                className="w-full lg:w-auto bg-gray-50 border-gray-200 text-gray-700 text-sm rounded-lg pl-10 cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
            <span className="text-gray-400 font-medium">-</span>
            <div className="relative flex-1 lg:flex-none group">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors pointer-events-none"
              />
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => (e.currentTarget).showPicker?.()}
                className="w-full lg:w-auto bg-gray-50 border-gray-200 text-gray-700 text-sm rounded-lg pl-10 cursor-pointer appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
              />
            </div>
          </div>
        </div>
        <button
          onClick={resetFilters}
          disabled={!hasFilters}
          className={`w-full lg:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
            hasFilters
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black cursor-pointer'
              : 'bg-gray-50 text-gray-300 cursor-not-allowed'
          }`}
        >
          <X size={16} />
          {t('partners.transactionsReset')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {hasTransactions ? (
        <div className="overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
          <div className="min-w-[800px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                    {t('partners.transactionsDate')}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 text-right">
                    {t('partners.transactionsAmount')}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 text-right">
                    {t('partners.transactionsBalance')}
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('partners.transactionsComment')}
                  </th>
                  <th className="py-4 px-4 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.map((tx, idx) => {
                  let type: 'topup' | 'expense' | 'commission' = 'commission';
                  if (tx.sum < 0) type = 'expense';
                  else if (
                    tx.comment.toLowerCase().includes('комиссия') ||
                    tx.comment.toLowerCase().includes('бонус')
                  )
                    type = 'commission';

                  const rowStyles =
                    {
                      expense:
                        'border-l-4 border-l-red-300 bg-red-50/20 hover:bg-red-50/50',
                      commission:
                        'border-l-4 border-l-emerald-400 bg-emerald-50/20 hover:bg-emerald-50/50',
                      topup:
                        'border-l-4 border-l-blue-400 bg-blue-50/20 hover:bg-blue-50/50',
                    }[type];
                  const sumStyles =
                    {
                      expense: 'text-red-600',
                      commission: 'text-emerald-600',
                      topup: 'text-blue-600',
                    }[type];
                  const iconConfig =
                    {
                      expense: {
                        Icon: ArrowUpCircle,
                        bg: 'bg-red-100',
                        text: 'text-red-600',
                      },
                      commission: {
                        Icon: Sparkles,
                        bg: 'bg-emerald-100',
                        text: 'text-emerald-600',
                      },
                      topup: {
                        Icon: ArrowDownCircle,
                        bg: 'bg-blue-100',
                        text: 'text-blue-600',
                      },
                    }[type];
                  const IconComponent = iconConfig.Icon;

                  return (
                    <tr
                      key={idx}
                      className={`${rowStyles} transition-colors group relative`}
                    >
                      <td className="py-4 px-6 text-sm text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${iconConfig.bg} ${iconConfig.text} shrink-0`}
                          >
                            <IconComponent size={14} />
                          </div>
                          {tx.date}
                        </div>
                      </td>
                      <td
                        className={`py-4 px-6 text-sm font-bold text-right whitespace-nowrap ${sumStyles}`}
                      >
                        {tx.sum > 0
                          ? `+ $${tx.sum}`
                          : `- $${Math.abs(tx.sum)}`}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-500 text-right whitespace-nowrap font-mono">
                        $ {tx.balance.toFixed(2)}
                      </td>
                      <td
                        className="py-4 px-6 text-sm text-gray-700 truncate max-w-xs sm:max-w-md md:max-w-xl"
                        title={tx.comment}
                      >
                        {tx.comment}
                      </td>
                      <td className="py-4 px-4 text-center relative">
                        <button
                          onClick={(e) => toggleMenu(idx, e)}
                          className={`p-1 rounded-full transition-colors ${
                            openMenuIndex === idx
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-300 hover:text-gray-600'
                          }`}
                        >
                          <MoreVertical size={18} />
                        </button>
                        {openMenuIndex === idx && (
                          <div
                            ref={menuRef}
                            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-48 bg-white rounded-lg shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-100 origin-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={handleDownloadInvoice}
                              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors first:rounded-t-lg last:rounded-b-lg flex items-center gap-2"
                            >
                              {t('partners.transactionsDownloadInvoice')}
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
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Filter size={20} className="text-gray-400" />
            </div>
            <span>{t('partners.transactionsNoData')}</span>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:underline mt-2"
            >
              {t('partners.transactionsResetFilters')}
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
