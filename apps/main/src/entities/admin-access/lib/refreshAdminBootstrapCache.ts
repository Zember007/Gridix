import type { QueryClient } from "@tanstack/react-query";
import { ADMIN_BOOTSTRAP_QUERY_KEY_PREFIX } from "../queries/useAdminAccessQuery";

/** Refetch admin bootstrap so project list and plan/subscription flags match the database. */
export async function refreshAdminBootstrapCache(
  queryClient: QueryClient,
): Promise<void> {
  await queryClient.refetchQueries({
    queryKey: [...ADMIN_BOOTSTRAP_QUERY_KEY_PREFIX],
  });
}
