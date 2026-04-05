const DRIVER_ACTIVE_CLASS = "driver-active-element";
const DRIVER_DUMMY_ID = "driver-dummy-element";
const SIDEBAR_SELECTOR = ".sidebar_usertour";

// Sidebar: border + outline (box-shadow clipped by overflow:hidden)
const SIDEBAR_BORDER = "2px solid rgba(255, 255, 255, 0.85)";
const SIDEBAR_OUTLINE = "4px solid rgba(255, 255, 255, 0.18)";
const SIDEBAR_OUTLINE_OFFSET = "-1px";

// Default: soft box-shadow glow
const DEFAULT_SHADOW =
  "0 0 0 3px rgba(255, 255, 255, 0.5), 0 0 16px 4px rgba(255, 255, 255, 0.25)";

let observer: MutationObserver | null = null;
let trackedEl: HTMLElement | null = null;
let usedStrategy: "sidebar" | "default" | null = null;

function isInsideSidebar(el: HTMLElement): boolean {
  return el.closest(SIDEBAR_SELECTOR) !== null;
}

function applySpotlight(el: HTMLElement): void {
  if (trackedEl === el) return;
  if (trackedEl) clearSpotlight(trackedEl);
  trackedEl = el;

  if (isInsideSidebar(el)) {
    usedStrategy = "sidebar";
    el.dataset.gridixBorderBackup = el.style.border;
    el.dataset.gridixOutlineBackup = el.style.outline;
    el.dataset.gridixOutlineOffsetBackup = el.style.outlineOffset;
    el.style.setProperty("border", SIDEBAR_BORDER, "important");
    el.style.setProperty("outline", SIDEBAR_OUTLINE, "important");
    el.style.setProperty("outline-offset", SIDEBAR_OUTLINE_OFFSET, "important");
  } else {
    usedStrategy = "default";
    el.dataset.gridixShadowBackup = el.style.boxShadow;
    el.style.setProperty("box-shadow", DEFAULT_SHADOW, "important");
  }
}

function clearSpotlight(el: HTMLElement): void {
  if (el !== trackedEl) return;

  if (usedStrategy === "sidebar") {
    const borderBackup = el.dataset.gridixBorderBackup ?? "";
    const outlineBackup = el.dataset.gridixOutlineBackup ?? "";
    const outlineOffsetBackup = el.dataset.gridixOutlineOffsetBackup ?? "";
    el.style.removeProperty("border");
    el.style.removeProperty("outline");
    el.style.removeProperty("outline-offset");
    if (borderBackup) el.style.border = borderBackup;
    if (outlineBackup) el.style.outline = outlineBackup;
    if (outlineOffsetBackup) el.style.outlineOffset = outlineOffsetBackup;
    delete el.dataset.gridixBorderBackup;
    delete el.dataset.gridixOutlineBackup;
    delete el.dataset.gridixOutlineOffsetBackup;
  } else {
    const shadowBackup = el.dataset.gridixShadowBackup ?? "";
    el.style.removeProperty("box-shadow");
    if (shadowBackup) el.style.boxShadow = shadowBackup;
    delete el.dataset.gridixShadowBackup;
  }

  trackedEl = null;
  usedStrategy = null;
}

function scan(): void {
  const el = document.querySelector<HTMLElement>(
    `.${DRIVER_ACTIVE_CLASS}:not(#${DRIVER_DUMMY_ID})`,
  );
  if (el) {
    applySpotlight(el);
  } else if (trackedEl) {
    clearSpotlight(trackedEl);
  }
}

/**
 * Запускает MutationObserver для подсветки элемента с классом `driver-active-element`.
 * Внутри сайдбара — border + outline (box-shadow обрезается overflow:hidden),
 * вне сайдбара — мягкий box-shadow glow.
 * Вызывается один раз из `createGridixDriver`; повторные вызовы безопасны (singleton).
 */
export function startGridixDriverSpotlightObserver(): void {
  if (typeof window === "undefined") return;
  if (observer) return;

  observer = new MutationObserver(scan);
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  });
  scan();
}

export function stopGridixDriverSpotlightObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (trackedEl) clearSpotlight(trackedEl);
}
