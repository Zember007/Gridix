import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchAndApplyLiveExchangeRates } from "@gridix/utils/lib";

const ExchangeRatesEpochContext = createContext(0);

export function useExchangeRatesEpoch(): number {
  return useContext(ExchangeRatesEpochContext);
}

interface ExchangeRatesProviderProps {
  children: ReactNode;
}

/**
 * Loads USD-based FX from open.er-api.com once on app mount so `convertPrice`
 * uses current rates instead of static fallbacks.
 */
export function ExchangeRatesProvider({
  children,
}: ExchangeRatesProviderProps) {
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetchAndApplyLiveExchangeRates().then((ok) => {
      if (!cancelled && ok) setEpoch((e) => e + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ExchangeRatesEpochContext.Provider value={epoch}>
      {children}
    </ExchangeRatesEpochContext.Provider>
  );
}
