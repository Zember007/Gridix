import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData, AnalyticsFiltersState } from "../model/types";
import { fetchAdminAnalytics } from "../api/analyticsApi";
import { normalizeAnalyticsResponse } from "../lib/utils";

interface UseAdminAnalyticsQueryParams extends AnalyticsFiltersState {
  userId: string | undefined;
  isManagerMode: boolean;
  activeWorkspaceId: string | null | undefined;
  enabled: boolean;
}

export function useAdminAnalyticsQuery({
  userId,
  isManagerMode,
  activeWorkspaceId,
  dateRange,
  selectedProject,
  dateFrom,
  dateTo,
  enabled,
}: UseAdminAnalyticsQueryParams) {
  return useQuery<AnalyticsData>({
    queryKey: [
      "adminAnalytics",
      userId,
      isManagerMode,
      activeWorkspaceId,
      dateRange,
      selectedProject,
      dateFrom,
      dateTo,
    ],
    enabled,
    staleTime: 120_000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const startedAt = performance.now();

      const raw = await fetchAdminAnalytics({
        dateRange,
        selectedProject,
        dateFrom,
        dateTo,
        isManagerMode,
        activeWorkspaceId,
      });

      if (import.meta.env.DEV) {
        const tookMs = Math.round(performance.now() - startedAt);
        console.log("[AdminAnalytics] loaded in", tookMs, "ms");
      }

      return normalizeAnalyticsResponse(raw);
    },
  });
}
