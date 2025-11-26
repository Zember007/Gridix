import { useState, useEffect, useRef, useMemo } from 'react';

const TRANSACTIONS = [
  {
    date: '12.11.2025',
    sum: 363,
    balance: 709.35,
    comment:
      'Начисление комиссии (20%). Клиент: STROYGOOD, Тариф: PRO (1 год)',
  },
  {
    date: '11.11.2025',
    sum: -151.25,
    balance: 346.35,
    comment:
      'Оплата подписки клиента. Клиент: STROYGOOD, Тариф: PRO (1 месяц)',
  },
  {
    date: '11.11.2025',
    sum: 151.25,
    balance: 497.6,
    comment: 'Пополнение счета через Stripe',
  },
  {
    date: '10.11.2025',
    sum: 25,
    balance: 346.35,
    comment: 'Бонус за регистрацию реферала: artem.dev@mail.ru',
  },
  {
    date: '08.11.2025',
    sum: -450,
    balance: 321.35,
    comment:
      'Оплата подписки клиента. Клиент: Dubai Estate Group, Тариф: BASIC (3 месяца)',
  },
  {
    date: '08.11.2025',
    sum: 500,
    balance: 771.35,
    comment: 'Пополнение счета (Банковский перевод)',
  },
  {
    date: '05.11.2025',
    sum: 72.6,
    balance: 271.35,
    comment:
      'Начисление комиссии (20%). Клиент: Batumi View, Тариф: PRO (1 месяц)',
  },
  {
    date: '01.11.2025',
    sum: -151.25,
    balance: 198.75,
    comment:
      'Оплата подписки клиента. Клиент: Next Group, Тариф: PRO (1 месяц)',
  },
  {
    date: '30.10.2025',
    sum: 50,
    balance: 350.0,
    comment: 'Начисление комиссии (20%). Клиент: Orbi Group',
  },
  {
    date: '28.10.2025',
    sum: 300,
    balance: 300.0,
    comment: 'Пополнение счета через Stripe',
  },
];

export function usePartnerAccountData() {
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
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  };

  const parseInputDate = (dateStr: string) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const filteredTransactions = useMemo(
    () =>
      TRANSACTIONS.filter((tx) => {
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
    [filterType, startDate, endDate],
  );

  const resetFilters = () => {
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  const hasFilters = filterType !== 'all' || startDate !== '' || endDate !== '';

  return {
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



