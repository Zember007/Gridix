import { useQuery } from "@tanstack/react-query";
import { listAgentCatalogProjects, listProjectUnits } from "../api/project-api";

export function useAgentCatalogProjectsQuery(activeWorkspaceId: string | null) {
  return useQuery({
    queryKey: ["agent", "catalog", "projects", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => listAgentCatalogProjects(activeWorkspaceId as string),
  });
}

export function useProjectUnitsQuery(
  activeWorkspaceId: string | null,
  projectId: string | undefined,
) {
  return useQuery({
    queryKey: [
      "agent",
      "catalog",
      "project-units",
      activeWorkspaceId,
      projectId,
    ],
    enabled: !!activeWorkspaceId && !!projectId,
    queryFn: async () =>
      listProjectUnits(activeWorkspaceId as string, projectId as string),
  });
}
