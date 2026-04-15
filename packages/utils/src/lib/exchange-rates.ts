import type { CurrencyType } from "./currency-utils";
import { FALLBACK_RUB_PER_UNIT, setLiveRubPerUnit } from "./currency-utils";

/**
 * Fetches USD-based rates from open.er-api.com (ExchangeRate-API) and updates
 * RUB-per-unit multipliers used by `convertPrice`. Falls back to static rates on error.
 *
 * @see https://www.exchangerate-api.com/docs/free
 */
export async function fetchAndApplyLiveExchangeRates(): Promise<boolean> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!res.ok) return false;

    const data = (await res.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };

    if (data.result !== "success" || !data.rates) return false;

    const { rates } = data;
    const rubPerUsd = rates.RUB;
    const eurPerUsd = rates.EUR;
    const gelPerUsd = rates.GEL;
    const kztPerUsd = rates.KZT;

    if (
      typeof rubPerUsd !== "number" ||
      rubPerUsd <= 0 ||
      typeof eurPerUsd !== "number" ||
      eurPerUsd <= 0 ||
      typeof gelPerUsd !== "number" ||
      gelPerUsd <= 0
    ) {
      return false;
    }

    const kztMultiplier =
      typeof kztPerUsd === "number" && kztPerUsd > 0
        ? rubPerUsd / kztPerUsd
        : FALLBACK_RUB_PER_UNIT.KZT;

    const next: Record<CurrencyType, number> = {
      RUB: 1,
      USD: rubPerUsd,
      EUR: rubPerUsd / eurPerUsd,
      GEL: rubPerUsd / gelPerUsd,
      KZT: kztMultiplier,
    };

    setLiveRubPerUnit(next);
    return true;
  } catch {
    return false;
  }
}
