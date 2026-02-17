import * as React from "react";

const WIDGET_ROOT_ID = "gridix-widget-root";
const PORTAL_CONTAINER_ID = "gridix-portal-container";

function getDeepActiveElement(): Element | null {
  if (typeof document === "undefined") return null;

  const active = document.activeElement;
  if (!active) return null;

  const shadowActive = (active as HTMLElement).shadowRoot?.activeElement;
  return shadowActive ?? active;
}

function resolveWidgetPortalContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const widgetHost = document.getElementById(
    WIDGET_ROOT_ID,
  ) as HTMLElement | null;
  const shadowRoot = widgetHost?.shadowRoot;
  if (!shadowRoot) return null;

  const deepActive = getDeepActiveElement();
  if (!deepActive) return null;

  // Only portal into widget ShadowRoot when the current interaction/focus
  // is actually inside that widget. This avoids hijacking portals across the
  // whole page when the widget is present alongside the main app.
  if (!shadowRoot.contains(deepActive)) return null;

  return shadowRoot.getElementById(PORTAL_CONTAINER_ID) as HTMLElement | null;
}

export function useWidgetPortalContainer(): HTMLElement | null {
  const [container, setContainer] = React.useState<HTMLElement | null>(() =>
    resolveWidgetPortalContainer(),
  );

  React.useEffect(() => {
    const update = () => setContainer(resolveWidgetPortalContainer());

    update();

    // Keep it in sync when focus/interaction switches between app and widget.
    window.addEventListener("focusin", update, true);
    window.addEventListener("pointerdown", update, true);

    return () => {
      window.removeEventListener("focusin", update, true);
      window.removeEventListener("pointerdown", update, true);
    };
  }, []);

  return container;
}
