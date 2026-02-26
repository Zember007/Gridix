import { useQuery } from "@tanstack/react-query";
import { listAgentCatalogProjects } from "../api/catalog-api";

export function useAgentCatalogQuery(activeWorkspaceId: string | null) {
  return useQuery({
    queryKey: ["agent", "catalog", "projects", activeWorkspaceId],
    enabled: !!activeWorkspaceId,
    queryFn: async () => listAgentCatalogProjects(activeWorkspaceId as string),
  });
}
