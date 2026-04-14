import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/** Matches Tailwind `lg` — viewports narrower than this often use compact controls (e.g. select instead of tabs). */
const LG_BREAKPOINT = 1024;

/** Viewports narrower than this use compact stacked patterns (e.g. project header view mode row). */
const NARROW_MOBILE_BREAKPOINT = 425;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/** `true` when viewport width is strictly less than 1024px (below Tailwind `lg`). */
export function useIsBelowLg() {
  const [isBelow, setIsBelow] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsBelow(window.innerWidth < LG_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsBelow(window.innerWidth < LG_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isBelow;
}

/** `true` when viewport width is strictly less than 425px. */
export function useIsNarrowMobileViewport() {
  const [isNarrow, setIsNarrow] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${NARROW_MOBILE_BREAKPOINT - 1}px)`,
    );
    const onChange = () => {
      setIsNarrow(window.innerWidth < NARROW_MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsNarrow(window.innerWidth < NARROW_MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isNarrow;
}
