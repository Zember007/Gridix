function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.location !== "undefined"
  );
}

/**
 * Dev / QA режим для повторного запуска туров Driver.js без записи once-ключей.
 *
 * Порядок:
 * 1. Query `?dev_tour=1` или `?dev_tour=true`
 * 2. `VITE_DRIVER_DEV_TOUR`
 */
export function isDriverDevMode(): boolean {
  if (!isBrowser()) return false;

  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get("dev_tour");
    if (qp === "true" || qp === "1") return true;
  } catch {
    // ignore
  }

  const driverEnv = import.meta.env.VITE_DRIVER_DEV_TOUR;
  return driverEnv === "true" || driverEnv === "1";
}
