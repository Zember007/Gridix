import { flushSync } from "react-dom";
import type { NavigateFunction, NavigateOptions, To } from "react-router-dom";

/**
 * SPA view transitions: pairs old/new snapshots for elements that share the same
 * `view-transition-name` (see SimplifiedSidebar desktop `<aside>`).
 */
export function runWithViewTransition(update: () => void): void {
  if (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function"
  ) {
    document.startViewTransition(() => {
      flushSync(update);
    });
    return;
  }
  update();
}

export function navigateWithViewTransition(
  navigate: NavigateFunction,
  to: To | number,
  options?: NavigateOptions,
): void {
  runWithViewTransition(() => {
    if (typeof to === "number") {
      navigate(to);
      return;
    }
    navigate(to, options);
  });
}
