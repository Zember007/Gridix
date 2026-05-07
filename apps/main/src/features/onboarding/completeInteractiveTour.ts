import type { QueryClient } from "@tanstack/react-query";
import {
  markDriverTourCompletedOnce,
  isDriverDevMode,
} from "@gridix/utils/integrations";
import { supabase } from "@/shared/api/supabase";
import { refreshAdminBootstrapCache } from "@/entities/admin-access/lib/refreshAdminBootstrapCache";

/**
 * Фиксирует завершение Driver.js тура: RPC (истина в БД) + локальный LS + refetch bootstrap.
 */
export async function completeInteractiveTour(
  userId: string,
  tourId: string,
  queryClient?: QueryClient,
): Promise<void> {
  if (!userId || !tourId) return;
  if (isDriverDevMode()) return;

  const { error } = await supabase.rpc("merge_completed_interactive_tour", {
    p_tour_id: tourId,
  });

  if (error) {
    console.warn(
      "completeInteractiveTour: merge_completed_interactive_tour failed:",
      error,
    );
  }

  markDriverTourCompletedOnce(userId, tourId);

  if (!error && queryClient) {
    try {
      await refreshAdminBootstrapCache(queryClient);
    } catch (e) {
      console.warn("completeInteractiveTour: bootstrap refetch failed:", e);
    }
  }
}
