import { useQuery } from "@tanstack/react-query";
import { fetchAdminBootstrap } from "../api/adminAccessApi";
import type { AdminBootstrapResponse } from "../model/types";

/** Prefix for TanStack Query; use with `invalidateQueries` / `refetchQueries` after project mutations. */
export const ADMIN_BOOTSTRAP_QUERY_KEY_PREFIX = ["adminBootstrap"] as const;

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
    queryKey: [
      ...ADMIN_BOOTSTRAP_QUERY_KEY_PREFIX,
      userId,
      isManagerMode,
      activeWorkspaceId,
    ],
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
