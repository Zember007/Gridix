let uiBlocked = false;
const uiBlockedListeners = new Set<() => void>();

function setUiBlocked(next: boolean) {
  if (uiBlocked === next) return;
  uiBlocked = next;
  uiBlockedListeners.forEach((cb) => cb());
}

export function getOnboardingUiBlocked(): boolean {
  return uiBlocked;
}

export function subscribeOnboardingUiBlocked(cb: () => void): () => void {
  uiBlockedListeners.add(cb);
  return () => uiBlockedListeners.delete(cb);
}

/**
 * Короткая блокировка UI перед стартом onboarding (Driver.js): задержка + max duration,
 * чтобы клики не «просачивались» до готовности оверлея.
 */
export async function withOnboardingUiBlocked<T>(
  fn: () => Promise<T>,
): Promise<T> {
  const BLOCK_DELAY_MS = 200;
  const MAX_BLOCK_MS = 700;

  let delayTimer: ReturnType<typeof setTimeout> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;

  delayTimer = setTimeout(() => {
    setUiBlocked(true);
    maxTimer = setTimeout(() => setUiBlocked(false), MAX_BLOCK_MS);
  }, BLOCK_DELAY_MS);

  try {
    return await fn();
  } finally {
    if (delayTimer) clearTimeout(delayTimer);
    if (maxTimer) clearTimeout(maxTimer);
    setUiBlocked(false);
  }
}

/** Снять блокировку (например при выходе из аккаунта). */
export function resetOnboardingUiBlock(): void {
  setUiBlocked(false);
}
