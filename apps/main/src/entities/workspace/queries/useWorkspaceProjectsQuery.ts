import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useUserRole } from "@/hooks/useUserRole";
import { fetchWorkspaceProjects } from "@/entities/workspace/api/workspaceApi";
import type { Project } from "@/entities/project/api/projectApi";

export const useWorkspaceProjectsQuery = () => {
  const { user } = useAuth();
  const { activeWorkspaceId, isManagerMode } = useWorkspace();
  const { userRole } = useUserRole();

  const query = useQuery<Project[]>({
    queryKey: [
      "workspace-projects",
      user?.id ?? null,
      activeWorkspaceId,
      isManagerMode,
      userRole.type,
    ],
    enabled: !!user && userRole.type !== "loading",
    queryFn: async () => {
      if (!user) return [];

      return fetchWorkspaceProjects({
        userId: user.id,
        activeWorkspaceId,
        isManagerMode,
      });
    },
  });

  return {
    ...query,
    projects: query.data ?? [],
    isManagerMode,
  };
};
