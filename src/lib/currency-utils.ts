export type CurrencyType = 'RUB' | 'USD' | 'EUR' | 'GEL';

export interface CurrencyInfo {
  code: CurrencyType;
  symbol: string;
  name: string;
  translationKey: string;
}

export const CURRENCIES: Record<CurrencyType, CurrencyInfo> = {
  RUB: {
    code: 'RUB',
    symbol: '₽',
    name: 'Russian Ruble',
    translationKey: 'currency.rub'
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    translationKey: 'currency.usd'
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    translationKey: 'currency.eur'
  },
  GEL: {
    code: 'GEL',
    symbol: '₾',
    name: 'Georgian Lari',
    translationKey: 'currency.gel'
  }
};

export const DEFAULT_CURRENCY: CurrencyType = 'USD';

export const getCurrencySymbol = (currency: CurrencyType): string => {
  return CURRENCIES[currency]?.symbol || '$';
};

export const getCurrencyInfo = (currency: CurrencyType): CurrencyInfo => {
  return CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
};

export const formatPrice = (price: number, currency: CurrencyType): string => {
  const symbol = getCurrencySymbol(currency);
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return `${formatter.format(price)} ${symbol}`;
};

export const isValidCurrency = (currency: string): currency is CurrencyType => {
  return Object.keys(CURRENCIES).includes(currency as CurrencyType);
};

export const getCurrencySymbolSafe = (currency: string | null): string => {
  if (!currency) return '₽'; // Default to ruble if no currency specified
  return isValidCurrency(currency) ? getCurrencySymbol(currency) : '₽';
};

export const formatPriceWithCurrency = (price: number, currency: string | null, locale: string = 'ru-RU'): string => {
  if (!price) return 'Цена по запросу';
  
  const symbol = getCurrencySymbolSafe(currency);
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return `${formatter.format(price)} ${symbol}`;
};