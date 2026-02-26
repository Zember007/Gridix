import { useQuery } from "@tanstack/react-query";
import { getAgentAnalyticsPage } from "../api/analytics-api";

export function useAgentAnalyticsQuery(
  activeWorkspaceId: string | null,
  period: string,
) {
  return useQuery({
    queryKey: ["agent", "analytics", "page", activeWorkspaceId, period],
    enabled: !!activeWorkspaceId,
    queryFn: async () =>
      getAgentAnalyticsPage(activeWorkspaceId as string, period),
  });
}
