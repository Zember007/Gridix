import { useQuery } from "@tanstack/react-query";
import { listProjectUnits } from "../api/catalog-api";

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
