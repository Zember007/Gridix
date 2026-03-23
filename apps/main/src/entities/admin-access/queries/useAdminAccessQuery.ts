import { useQuery } from "@tanstack/react-query";
import { fetchAdminBootstrap } from "../api/adminAccessApi";
import type { AdminBootstrapResponse } from "../model/types";

interface UseAdminAccessQueryParams {
  userId: string | undefined;
  isManagerMode: boolean;
  activeWorkspaceId: string | null | undefined;
  enabled: boolean;
}

export function useAdminAccessQuery({
  userId,
  isManagerMode,
  activeWorkspaceId,
  enabled,
}: UseAdminAccessQueryParams) {
  return useQuery<AdminBootstrapResponse>({
    queryKey: ["adminBootstrap", userId, isManagerMode, activeWorkspaceId],
    enabled,
    staleTime: 60_000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: () =>
      fetchAdminBootstrap({
        isManagerMode,
        activeWorkspaceId,
      }),
  });
}
