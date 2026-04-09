import { useQuery } from "@tanstack/react-query";
import { listSubProjects } from "@/features/genplan/api/genplanApi";

export const useAdminWidgetSubProjects = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ["admin-widgets", "sub-projects", projectId],
    queryFn: () => listSubProjects(projectId!),
    enabled: Boolean(projectId),
  });
};
