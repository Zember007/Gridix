import { useQuery } from "@tanstack/react-query";
import { supabase } from "@gridix/utils/api";
import { useUserRole } from "@/hooks/useUserRole";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { getManagerProjectIds } from "@/hooks/useManagerProjectIds";

interface LeadStats {
  total: number;
  pending: number;
  sent: number;
  savedOnly: number;
  failed: number;
  cancelled: number;
}

/**
 * Хук для получения статистики лидов по всем проектам разом
 * Загружает failed leads один раз и группирует их по project_id
 */
export const useAllFailedLeadsStats = () => {
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { activeWorkspaceId } = useWorkspace();

  const { data: statsByProject = {}, isLoading } = useQuery<
    Record<string, LeadStats>
  >({
    queryKey: ["allFailedLeadsStats", userRole.type, activeWorkspaceId],
    enabled: userRole.type !== "loading" && !!user,
    staleTime: 2 * 60 * 1000, // 2 минуты
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Record<string, LeadStats>> => {
      if (!user) return {};

      try {
        // Определяем доступные проекты
        let projectIds: string[] | null = null;

        if (userRole.type === "manager" && activeWorkspaceId) {
          projectIds = await getManagerProjectIds(user.id, activeWorkspaceId);
          if (projectIds.length === 0) {
            return {};
          }
        } else {
          // Для застройщика - все свои проекты
          const { data: projects } = await supabase
            .from("projects")
            .select("id")
            .eq("user_id", user.id);

          projectIds = projects?.map((p) => p.id) || [];
        }

        if (!projectIds || projectIds.length === 0) {
          return {};
        }

        // Загружаем все лиды для доступных проектов одним запросом
        const query = supabase
          .from("leads")
          .select("project_id, status")
          .in("project_id", projectIds);

        const { data: leads, error } = await query;

        if (error) throw error;

        // Группируем статистику по project_id
        const stats: Record<string, LeadStats> = {};

        (leads || []).forEach(
          (lead: { project_id: string | null; status: string | null }) => {
            const projectId = lead.project_id;
            if (!projectId) return;

            if (!stats[projectId]) {
              stats[projectId] = {
                total: 0,
                pending: 0,
                sent: 0,
                savedOnly: 0,
                failed: 0,
                cancelled: 0,
              };
            }

            stats[projectId].total += 1;

            switch (lead.status) {
              case "pending":
                stats[projectId].pending += 1;
                break;
              case "sent_to_crm":
                stats[projectId].sent += 1;
                break;
              case "saved_only":
                stats[projectId].savedOnly += 1;
                break;
              case "failed":
                stats[projectId].failed += 1;
                break;
              case "cancelled":
                stats[projectId].cancelled += 1;
                break;
            }
          },
        );

        return stats;
      } catch (err) {
        console.error("Error loading failed leads stats:", err);
        return {};
      }
    },
  });

  return {
    statsByProject,
    loading: isLoading,
    getStatsForProject: (projectId: string): LeadStats => {
      return (
        statsByProject[projectId] || {
          total: 0,
          pending: 0,
          sent: 0,
          savedOnly: 0,
          failed: 0,
          cancelled: 0,
        }
      );
    },
  };
};
