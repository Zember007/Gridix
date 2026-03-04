import { useQuery } from "@tanstack/react-query";
import { getAgentDashboard } from "../api/dashboard-api";

export function useAgentDashboardQuery(activeWorkspaceId: string | null) {
  return useQuery({
    queryKey: ["agent", "dashboard", "data", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => getAgentDashboard(activeWorkspaceId as string),
  });
}
