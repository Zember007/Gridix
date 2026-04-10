import {
  ADMIN_CHECKLIST_AUTOPANEL_TOUR_ID,
  clearDriverTourOnce,
  getProjectChecklistAutopanelTourId,
} from "@gridix/utils/integrations";
import {
  ADMIN_MAIN_DRIVER_TOUR_ID,
  PARTNERS_DRIVER_TOUR_ID,
  PROJECT_CREATION_DRIVER_TOUR_ID,
  PROJECT_EDITOR_DRIVER_TOUR_ID,
} from "@/features/onboarding/driver";

export function resetAdminInteractiveOnboardingStorage(userId: string): void {
  clearDriverTourOnce(userId, ADMIN_MAIN_DRIVER_TOUR_ID);
  clearDriverTourOnce(userId, ADMIN_CHECKLIST_AUTOPANEL_TOUR_ID);
  clearDriverTourOnce(userId, PARTNERS_DRIVER_TOUR_ID);
  clearDriverTourOnce(userId, PROJECT_CREATION_DRIVER_TOUR_ID);
}

export function resetProjectEditorInteractiveOnboardingStorage(
  userId: string,
  projectId: string,
): void {
  clearDriverTourOnce(userId, PROJECT_EDITOR_DRIVER_TOUR_ID);
  clearDriverTourOnce(userId, getProjectChecklistAutopanelTourId(projectId));
}
