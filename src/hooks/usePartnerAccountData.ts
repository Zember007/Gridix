import { useState, useEffect, useRef, useMemo } from 'react';
import { usePartnerStats } from './usePartnerStats';

export function usePartnerAccountData() {
  const { stats, loading, error } = usePartnerStats();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false);

  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuIndex(null);
      }
    };
    if (openMenuIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuIndex]);

  const toggleMenu = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuIndex(openMenuIndex === index ? null : index);
  };

  const handleDownloadInvoice = () => {
    setOpenMenuIndex(null);
    // Пока просто алерт с заглушкой, позже можно заменить на реальное скачивание
    alert('Скачивание инвойса...');
  };

  const parseDate = (dateStr: string) => {
    const [dayStr, monthStr, yearStr] = dateStr.split('.');
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    if (!year || !month || !day) return new Date(NaN);
    return new Date(year, month - 1, day);
  };

  const parseInputDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const baseTransactions = stats?.transactions ?? [];

  const filteredTransactions = useMemo(
    () =>
      baseTransactions.filter((tx) => {
        if (filterType === 'expense' && tx.sum >= 0) return false;
        if (
          filterType === 'income' &&
          (tx.sum < 0 ||
            tx.comment.includes('комиссия') ||
            tx.comment.includes('Бонус'))
        )
          return false;
        if (
          filterType === 'commission' &&
          (tx.sum < 0 ||
            (!tx.comment.includes('комиссия') &&
              !tx.comment.includes('Бонус')))
        )
          return false;

        const txDate = parseDate(tx.date);
        if (startDate) {
          const start = parseInputDate(startDate);
          if (start && txDate < start) return false;
        }
        if (endDate) {
          const end = parseInputDate(endDate);
          if (end && txDate > end) return false;
        }
        return true;
      }),
    [baseTransactions, filterType, startDate, endDate],
  );

  const resetFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = filterType !== 'all' || startDate !== '' || endDate !== '';

  return {
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
  };
}



