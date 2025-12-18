import { useLocation } from "react-router-dom";
import { useMemo } from "react";

/**
 * Хук для определения, открыт ли админ в режиме виджета AmoCRM.
 *
 * Если в query-параметрах есть `source=amo_widget`,
 * то `amoWidget` будет `true`, иначе `false`.
 */
export function useAmoWidget() {
  const location = useLocation();

  const amoWidget = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("source") === "amo_widget";
  }, [location.search]);

  return { amoWidget };
}


