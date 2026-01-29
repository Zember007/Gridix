import { useQuery } from "@tanstack/react-query";
import { fetchLeads, LeadFilters } from "@/entities/lead/api/leadApi";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { getManagerProjectIds } from "@/hooks/useManagerProjectIds";

const generateFiltersKey = (filters?: LeadFilters) =>
  JSON.stringify(filters || {}, Object.keys(filters || {}).sort());

export const useLeadsQuery = (filters?: LeadFilters) => {
  const { userRole } = useUserRole();
  const { activeWorkspaceId } = useWorkspace();
  const { user } = useAuth();

  const filtersKey = generateFiltersKey(filters);

  const query = useQuery({
    queryKey: [
      "leads",
      userRole.type,
      activeWorkspaceId,
      filtersKey,
    ],
    enabled: userRole.type !== "loading",
    queryFn: async () => {
      if (userRole.type === "manager" && activeWorkspaceId) {
        const userId = user?.id;
        if (!userId) return [];

        const projectIds = await getManagerProjectIds(userId, activeWorkspaceId);

        if (!projectIds || projectIds.length === 0) {
          return [];
        }

        return fetchLeads(filters, projectIds, userId);
      }

      return fetchLeads(filters, null, user?.id ?? null);
    },
  });

  return {
    ...query,
    leads: (query.data as any[]) || [],
  };
};
