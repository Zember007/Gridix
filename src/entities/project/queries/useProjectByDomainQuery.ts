import { useQuery } from "@tanstack/react-query";
import { fetchProjectByDomain } from "@/entities/project/api/projectApi";
import type { Tables } from "@/integrations/supabase/types";

type Project = Tables<'projects'>;

export interface ProjectByDomainResult {
  project: Project | null;
  isDomainProject: boolean;
}

export const useProjectByDomainQuery = (hostname?: string) => {
  const query = useQuery<ProjectByDomainResult>({
    queryKey: ["project-by-domain", hostname ?? null],
    queryFn: async () => {
      const host = (hostname || window.location.hostname).toLowerCase();

      const mainHosts = (import.meta.env.VITE_MAIN_HOSTNAMES || "localhost,127.0.0.1")
        .split(",")
        .map((x: string) => x.trim().toLowerCase())
        .filter(Boolean);

      if (mainHosts.includes(host)) {
        return {
          project: null,
          isDomainProject: false,
        };
      }

      const data = await fetchProjectByDomain(host);

      if (data && (data as any).projects) {
        return {
          project: (data as any).projects as Project,
          isDomainProject: true,
        };
      }

      return {
        project: null,
        isDomainProject: false,
      };
    },
  });

  return {
    ...query,
    project: query.data?.project ?? null,
    isDomainProject: query.data?.isDomainProject ?? false,
  };
};
