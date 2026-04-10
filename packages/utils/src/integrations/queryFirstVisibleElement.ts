/**
 * Returns whether `el` is likely visible in the layout (non-zero box, not fully hidden by CSS).
 * Does not recurse into ancestors; hidden ancestors typically yield empty / zero client rects.
 */
function isElementVisuallyPresent(el: Element): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;

  const style = window.getComputedStyle(el);
  if (style.display === "none") return false;
  if (style.visibility === "hidden" || style.visibility === "collapse")
    return false;

  const opacity = parseFloat(style.opacity);
  if (Number.isFinite(opacity) && opacity === 0) return false;

  const rects = el.getClientRects();
  for (let i = 0; i < rects.length; i++) {
    const r = rects.item(i);
    if (r && r.width > 0 && r.height > 0) return true;
  }
  return false;
}

/**
 * Like `document.querySelector`, but returns the first matching element that is visually present.
 * Use when the same selector appears multiple times for responsive layouts (e.g. desktop + mobile tab rows).
 */
export function queryFirstVisibleElement(selector: string): HTMLElement | null {
  if (typeof document === "undefined") return null;

  const nodes = document.querySelectorAll(selector);
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes.item(i);
    if (node && isElementVisuallyPresent(node)) return node;
  }
  return null;
}
