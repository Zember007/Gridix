import { useQuery } from "@tanstack/react-query";
import { fetchLeads, LeadFilters } from "@/entities/lead/api/leadApi";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { getManagerProjectIds } from "@/hooks/useManagerProjectIds";
import { useAdminAccess } from "@/entities/admin-access";

const generateFiltersKey = (filters?: LeadFilters) =>
  JSON.stringify(filters || {}, Object.keys(filters || {}).sort());

type UseLeadsQueryOptions = {
  enabled?: boolean;
};

export const useLeadsQuery = (
  filters?: LeadFilters,
  options: UseLeadsQueryOptions = {},
) => {
  const { userRole } = useUserRole();
  const { activeWorkspaceId } = useWorkspace();
  const { user } = useAuth();
  const adminAccess = useAdminAccess();

  const filtersKey = generateFiltersKey(filters);
  const activeProjectIds = adminAccess?.access?.active_project_ids ?? [];

  const query = useQuery({
    queryKey: [
      "leads",
      userRole.type,
      activeWorkspaceId,
      filtersKey,
      activeProjectIds.join(","),
    ],
    enabled: userRole.type !== "loading" && (options.enabled ?? true),
    queryFn: async () => {
      if (adminAccess) {
        if (!adminAccess.canViewLeads || activeProjectIds.length === 0) {
          return [];
        }

        const scopedProjectIds = filters?.projectId
          ? activeProjectIds.includes(filters.projectId)
            ? [filters.projectId]
            : []
          : activeProjectIds;

        if (scopedProjectIds.length === 0) {
          return [];
        }

        return fetchLeads(filters, scopedProjectIds, user?.id ?? null);
      }

      if (userRole.type === "manager" && activeWorkspaceId) {
        const userId = user?.id;
        if (!userId) return [];

        const projectIds = await getManagerProjectIds(
          userId,
          activeWorkspaceId,
        );

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
