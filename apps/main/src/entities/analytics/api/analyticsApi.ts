import { supabase } from "@/shared/api/supabase";
import type { AnalyticsFiltersState } from "../model/types";

interface FetchParams extends AnalyticsFiltersState {
  isManagerMode: boolean;
  activeWorkspaceId: string | null | undefined;
}

export async function fetchAdminAnalytics(
  params: FetchParams,
): Promise<Record<string, unknown>> {
  const {
    dateRange,
    selectedProject,
    dateFrom,
    dateTo,
    isManagerMode,
    activeWorkspaceId,
  } = params;

  const { data, error } = await supabase.functions.invoke("admin-analytics", {
    body: {
      dateRange,
      selectedProject,
      dateFrom,
      dateTo,
      isManagerMode,
      developerId:
        isManagerMode && activeWorkspaceId ? activeWorkspaceId : null,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? {}) as Record<string, unknown>;
}
