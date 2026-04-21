export type CurrencyType = "RUB" | "USD" | "EUR" | "GEL" | "KZT";

export interface CurrencyInfo {
  code: CurrencyType;
  symbol: string;
  name: string;
  translationKey: string;
}

export const CURRENCIES: Record<CurrencyType, CurrencyInfo> = {
  RUB: {
    code: "RUB",
    symbol: "₽",
    name: "Russian Ruble",
    translationKey: "currency.rub",
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    translationKey: "currency.usd",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    translationKey: "currency.eur",
  },
  GEL: {
    code: "GEL",
    symbol: "₾",
    name: "Georgian Lari",
    translationKey: "currency.gel",
  },
  KZT: {
    code: "KZT",
    symbol: "₸",
    name: "Kazakhstani Tenge",
    translationKey: "currency.kzt",
  },
};

export const DEFAULT_CURRENCY: CurrencyType = "USD";

export const getCurrencySymbol = (currency: CurrencyType): string => {
  return CURRENCIES[currency]?.symbol || "$";
};

export const getCurrencyInfo = (currency: CurrencyType): CurrencyInfo => {
  return CURRENCIES[currency] || CURRENCIES[DEFAULT_CURRENCY];
};

export const formatPrice = (price: number, currency: CurrencyType): string => {
  const symbol = getCurrencySymbol(currency);
  const formatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${formatter.format(price)} ${symbol}`;
};

export const isValidCurrency = (currency: string): currency is CurrencyType => {
  return Object.keys(CURRENCIES).includes(currency as CurrencyType);
};

export const getCurrencySymbolSafe = (currency: string | null): string => {
  if (!currency) return "$"; // Default to ruble if no currency specified
  return isValidCurrency(currency) ? getCurrencySymbol(currency) : "₽";
};

/** Groups integer digits with ASCII spaces only (no commas, NBSP, or locale quirks). */
export function formatIntegerWithSpaceGrouping(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded).toString();
  return sign + abs.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Like `formatPriceWithCurrency` but thousands separated with ordinary spaces only. */
export const formatPriceWithCurrencySpaces = (
  price: number,
  currency: string | null,
): string => {
  if (!price) return "Цена по запросу";

  const symbol = getCurrencySymbolSafe(currency);
  return `${formatIntegerWithSpaceGrouping(price)} ${symbol}`;
};

export const formatPriceWithCurrency = (
  price: number,
  currency: string | null,
  locale: string = "en-US",
): string => {
  if (!price) return "Цена по запросу";

  const symbol = getCurrencySymbolSafe(currency);
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return `${formatter.format(price)} ${symbol}`;
};

export const formatMoney = (
  price: number,
  currency: string | null,
  locale: string = "en-US",
): string => {
  return formatPriceWithCurrency(price, currency, locale);
};

/** Static fallback: RUB per 1 unit of currency (used before live rates load or if API fails). */
export const FALLBACK_RUB_PER_UNIT: Record<CurrencyType, number> = {
  RUB: 1,
  USD: 90.9090909091,
  EUR: 100,
  GEL: 33.3333333333,
  KZT: 0.2,
};

let liveRubPerUnit: Record<CurrencyType, number> | null = null;

/** Replaces multipliers used by `convertPrice` (typically from open.er-api.com). */
export function setLiveRubPerUnit(
  rates: Record<CurrencyType, number> | null,
): void {
  liveRubPerUnit = rates;
}

function getActiveRubPerUnit(): Record<CurrencyType, number> {
  return liveRubPerUnit ?? FALLBACK_RUB_PER_UNIT;
}

export const convertPrice = (
  price: number,
  fromCurrency: string | null | undefined,
  toCurrency: string | null | undefined,
): number => {
  if (!price) return 0;
  const rubPerUnit = getActiveRubPerUnit();
  const from: CurrencyType = isValidCurrency(String(fromCurrency))
    ? (fromCurrency as CurrencyType)
    : "RUB";
  const to: CurrencyType = isValidCurrency(String(toCurrency))
    ? (toCurrency as CurrencyType)
    : "RUB";
  const priceInRub = price * rubPerUnit[from];
  return priceInRub / rubPerUnit[to];
};
