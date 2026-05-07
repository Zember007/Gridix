import {
  ADMIN_CHECKLIST_AUTOPANEL_TOUR_ID,
  clearDriverTourOnce,
  getProjectChecklistAutopanelTourId,
} from "@gridix/utils/integrations";
import { supabase } from "@/shared/api/supabase";
import {
  ADMIN_MAIN_DRIVER_TOUR_ID,
  PARTNERS_DRIVER_TOUR_ID,
  PROJECT_CREATION_DRIVER_TOUR_ID,
  PROJECT_EDITOR_DRIVER_TOUR_ID,
} from "@/features/onboarding/driver";

const ADMIN_TRAINING_REMOTE_TOUR_IDS = [
  ADMIN_MAIN_DRIVER_TOUR_ID,
  PARTNERS_DRIVER_TOUR_ID,
  PROJECT_CREATION_DRIVER_TOUR_ID,
];

export async function resetAdminInteractiveOnboardingStorage(
  userId: string,
): Promise<void> {
  if (!userId) return;

  for (const id of ADMIN_TRAINING_REMOTE_TOUR_IDS) {
    clearDriverTourOnce(userId, id);
  }

  /** Локально: только сопутствующий milestone панели (не сохраняем в колонке БД). */
  clearDriverTourOnce(userId, ADMIN_CHECKLIST_AUTOPANEL_TOUR_ID);

  const { error } = await supabase.rpc("remove_completed_interactive_tours", {
    p_tour_ids: ADMIN_TRAINING_REMOTE_TOUR_IDS,
  });
  if (error) {
    console.warn(
      "resetAdminInteractiveOnboardingStorage: remove_completed_interactive_tours failed:",
      error,
    );
  }
}

export async function resetProjectEditorInteractiveOnboardingStorage(
  userId: string,
  projectId: string,
): Promise<void> {
  if (!userId || !projectId) return;

  clearDriverTourOnce(userId, PROJECT_EDITOR_DRIVER_TOUR_ID);
  clearDriverTourOnce(userId, getProjectChecklistAutopanelTourId(projectId));

  const autopanelId = getProjectChecklistAutopanelTourId(projectId);

  const { error } = await supabase.rpc("remove_completed_interactive_tours", {
    p_tour_ids: [PROJECT_EDITOR_DRIVER_TOUR_ID, autopanelId],
  });
  if (error) {
    console.warn(
      "resetProjectEditorInteractiveOnboardingStorage: RPC failed:",
      error,
    );
  }
}
