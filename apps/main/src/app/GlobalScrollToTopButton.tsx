import { ScrollToTopButton } from "@gridix/ui";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const LOGIN_PATH_MATCHERS = [/\/auth(?:\/|$)/, /\/set-password(?:\/|$)/];

function hasOpenModalOrDrawer(): boolean {
  if (typeof document === "undefined") return false;

  return Boolean(
    document.querySelector(
      [
        '[role="dialog"][data-state="open"]',
        '[data-state="open"][data-slot="dialog-content"]',
        '[data-state="open"][data-vaul-drawer]',
      ].join(", "),
    ),
  );
}

function hasListScopedScrollButton(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(document.querySelector('[data-list-scroll-scope="true"]'));
}

export function GlobalScrollToTopButton() {
  const { pathname } = useLocation();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [hasListScope, setHasListScope] = useState(false);

  const isHiddenOnAuthScreens = useMemo(() => {
    const lowerPathname = pathname.toLowerCase();
    return LOGIN_PATH_MATCHERS.some((matcher) => matcher.test(lowerPathname));
  }, [pathname]);

  useEffect(() => {
    const updateOverlayState = () => {
      setIsOverlayOpen(hasOpenModalOrDrawer());
      setHasListScope(hasListScopedScrollButton());
    };

    updateOverlayState();
    const observer = new MutationObserver(updateOverlayState);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state", "role", "data-slot", "data-vaul-drawer"],
    });

    return () => observer.disconnect();
  }, []);

  if (isHiddenOnAuthScreens || isOverlayOpen || hasListScope) {
    return null;
  }

  return (
    <ScrollToTopButton
      ariaLabel="Scroll to top"
      title="Scroll to top"
      className="fixed bottom-6 right-6 z-40"
      style={{ backgroundColor: ADMIN_THEME.primary }}
    />
  );
}
