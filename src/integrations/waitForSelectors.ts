type WaitForSelectorsOptions = {
  /**
   * How long to wait before failing.
   */
  timeoutMs?: number;
  /**
   * Polling interval.
   */
  intervalMs?: number;
  /**
   * If provided, we log minimal debug info when waiting times out.
   */
  debugLabel?: string;
};

/**
 * Wait until all selectors exist in DOM.
 * Returns `true` if ready, `false` on timeout.
 */
export async function waitForSelectors(
  selectors: string[],
  opts: WaitForSelectorsOptions = {},
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!selectors.length) return true;

  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 7000;
  const intervalMs = typeof opts.intervalMs === 'number' ? opts.intervalMs : 100;
  const start = Date.now();

  const allPresent = () => selectors.every((s) => !!document.querySelector(s));
  if (allPresent()) return true;

  return await new Promise<boolean>((resolve) => {
    const timer = window.setInterval(() => {
      if (allPresent()) {
        window.clearInterval(timer);
        resolve(true);
        return;
      }

      if (Date.now() - start >= timeoutMs) {
        window.clearInterval(timer);
        if (opts.debugLabel) {
          const missing = selectors.filter((s) => !document.querySelector(s));
          // eslint-disable-next-line no-console
          console.warn(`[waitForSelectors:${opts.debugLabel}] timed out, missing:`, missing);
        }
        resolve(false);
      }
    }, intervalMs);
  });
}

