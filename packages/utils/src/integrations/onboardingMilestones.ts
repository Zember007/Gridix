import { isDriverDevMode } from "./driver/devMode";
import {
  hasDriverTourCompletedOnce,
  markDriverTourCompletedOnce,
} from "./driver/onceStorage";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeLocalStorageGet(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Префикс ключа совместим с ранними версиями (`trackUsertourEvent`); менять нельзя —
 * иначе сбросится прогресс чеклиста у пользователей.
 */
export function getOnboardingOnceStorageKey(onceKey: string): string {
  return `usertour_once:${onceKey}`;
}

export function isOnboardingMilestoneCompleted(onceKey: string): boolean {
  return safeLocalStorageGet(getOnboardingOnceStorageKey(onceKey)) === "1";
}

const milestoneListeners = new Set<() => void>();

export function subscribeOnboardingMilestones(
  listener: () => void,
): () => void {
  milestoneListeners.add(listener);
  return () => milestoneListeners.delete(listener);
}

function notifyOnboardingMilestones(): void {
  milestoneListeners.forEach((l) => l());
}

export type ChecklistPanelOpenPayload =
  | { scope: "admin" }
  | { scope: "project"; projectId: string };

const checklistOpenListeners = new Set<
  (payload: ChecklistPanelOpenPayload) => void
>();

export function subscribeChecklistPanelOpen(
  cb: (payload: ChecklistPanelOpenPayload) => void,
): () => void {
  checklistOpenListeners.add(cb);
  return () => checklistOpenListeners.delete(cb);
}

export function requestOpenChecklistPanel(
  payload: ChecklistPanelOpenPayload,
): void {
  checklistOpenListeners.forEach((cb) => cb(payload));
}

/** Driver once-key for auto-opening the admin checklist panel after the main admin tour. */
export const ADMIN_CHECKLIST_AUTOPANEL_TOUR_ID = "admin_checklist_autopanel";

export function getProjectChecklistAutopanelTourId(projectId: string): string {
  return `project_checklist_autopanel:${projectId}`;
}

/**
 * After admin main Driver tour: open the in-app account checklist once per user (not in driver dev mode).
 */
export function tryAutoOpenAdminChecklistPanel(userId: string): void {
  if (!isBrowser()) return;
  if (isDriverDevMode()) return;
  if (hasDriverTourCompletedOnce(userId, ADMIN_CHECKLIST_AUTOPANEL_TOUR_ID))
    return;
  markDriverTourCompletedOnce(userId, ADMIN_CHECKLIST_AUTOPANEL_TOUR_ID);
  requestOpenChecklistPanel({ scope: "admin" });
}

/**
 * First visit to a project in the editor: open the in-app project checklist once per (user, project).
 */
export function tryAutoOpenProjectChecklistPanel(
  userId: string,
  projectId: string,
): void {
  if (!isBrowser()) return;
  if (isDriverDevMode()) return;
  const tourId = getProjectChecklistAutopanelTourId(projectId);
  if (hasDriverTourCompletedOnce(userId, tourId)) return;
  markDriverTourCompletedOnce(userId, tourId);
  requestOpenChecklistPanel({ scope: "project", projectId });
}

/** Опционально: метаданные пользователя для будущей синхронизации прогресса. */
export type OnboardingIdentifyPayload = {
  userId: string;
  email?: string | null;
  name?: string | null;
  signedUpAt?: string | null;
  companyName?: string | null;
  phone?: string | null;
  accountType?: string | null;
};

export type TrackOnboardingMilestoneParams = {
  eventName: string;
  properties?: Record<string, unknown>;
  identify?: OnboardingIdentifyPayload;
  onceKey?: string;
};

/**
 * Фиксирует milestone чеклиста: при `onceKey` — один раз в `localStorage`, затем уведомляет UI.
 * События без `onceKey` только обновляют подписчиков (редкий случай).
 */
export async function trackOnboardingMilestone(
  params: TrackOnboardingMilestoneParams,
): Promise<boolean> {
  if (!isBrowser()) return false;

  const { eventName, onceKey } = params;
  if (!eventName) return false;

  if (!onceKey) {
    notifyOnboardingMilestones();
    return true;
  }

  const storageKey = getOnboardingOnceStorageKey(onceKey);
  if (safeLocalStorageGet(storageKey) === "1") return false;

  try {
    window.localStorage.setItem(storageKey, "1");
  } catch {
    // ignore
  }

  notifyOnboardingMilestones();

  return true;
}

/** Alias (migration plan naming). */
export const emitOnboardingProgress = trackOnboardingMilestone;
