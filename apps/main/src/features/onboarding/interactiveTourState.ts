import {
  hasDriverTourCompletedOnce,
  isDriverDevMode,
  markDriverTourCompletedOnce,
} from "@gridix/utils/integrations";

/** Данные `user_profiles.completed_interactive_tours` и ответ `admin-bootstrap`. */
export type CompletedInteractiveTours = Record<string, string>;

function marksTourDone(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.length > 0;
  return true;
}

/**
 * Превращает сырое jsonb поле профиля / bootstrap в строковую карту id → время.
 */
export function normalizeCompletedInteractiveTours(
  raw: unknown,
): CompletedInteractiveTours {
  if (
    typeof raw !== "object" ||
    raw === null ||
    Array.isArray(raw) ||
    Object.keys(raw as object).length === 0
  ) {
    return {};
  }

  const out: CompletedInteractiveTours = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!marksTourDone(v)) continue;
    if (typeof v === "string") {
      out[k] = v;
    } else if (typeof v === "number" || typeof v === "boolean") {
      out[k] = String(v);
    } else if (typeof v === "object" && v !== null) {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        out[k] = "1";
      }
    }
  }
  return out;
}

/**
 * Сервер считается главным источником истины после bootstrap; LS — офлайн/кэш.
 */
export function isInteractiveTourMarkedComplete(
  userId: string,
  tourId: string,
  remoteCompleted: CompletedInteractiveTours | null | undefined,
): boolean {
  if (!userId) return false;
  if (isDriverDevMode()) return false;
  const remoteKnown =
    !!remoteCompleted && marksTourDone(remoteCompleted[tourId]);
  if (remoteKnown) return true;
  return hasDriverTourCompletedOnce(userId, tourId);
}

/** Копируем серверные completions в LS, чтобы утилиты `onceStorage` оставались согласованы. */
export function mirrorCompletedInteractiveToursToLocalStorage(
  userId: string,
  remote: CompletedInteractiveTours | null | undefined,
): void {
  if (!userId || !remote || isDriverDevMode()) return;
  for (const [tourId, ts] of Object.entries(remote)) {
    if (!marksTourDone(ts)) continue;
    markDriverTourCompletedOnce(userId, tourId);
  }
}
