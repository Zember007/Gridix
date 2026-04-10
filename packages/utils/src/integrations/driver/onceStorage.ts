import { isDriverDevMode } from "./devMode";

function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function buildOnceKey(userId: string, tourId: string): string {
  return `gridix_driver_once:${userId}:${tourId}`;
}

/** Дубликат localStorage в памяти (быстрые повторные чтения). */
const memoryCompleted = new Set<string>();

/**
 * Проверяет, был ли тур уже завершён для пользователя (once-per-user).
 * В dev-режиме всегда `false`, чтобы можно было перезапускать без очистки storage.
 */
export function hasDriverTourCompletedOnce(
  userId: string,
  tourId: string,
): boolean {
  if (isDriverDevMode()) return false;

  const key = buildOnceKey(userId, tourId);
  if (memoryCompleted.has(key)) return true;

  if (!isBrowser()) return false;
  try {
    if (window.localStorage.getItem(key) === "1") {
      memoryCompleted.add(key);
      return true;
    }
  } catch {
    // ignore quota / private mode
  }
  return false;
}

/**
 * Помечает тур как пройденный. В dev-режиме не пишет в localStorage.
 */
export function markDriverTourCompletedOnce(
  userId: string,
  tourId: string,
): void {
  if (isDriverDevMode()) return;

  const key = buildOnceKey(userId, tourId);
  memoryCompleted.add(key);
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

/** Сброс флага once (logout, тесты). */
export function clearDriverTourOnce(userId: string, tourId: string): void {
  const key = buildOnceKey(userId, tourId);
  memoryCompleted.delete(key);
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function getDriverTourOnceStorageKey(
  userId: string,
  tourId: string,
): string {
  return buildOnceKey(userId, tourId);
}
