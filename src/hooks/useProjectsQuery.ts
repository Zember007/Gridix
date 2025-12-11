import { useQuery } from "@tanstack/react-query";
import {
  fetchProjects,
  fetchProjectByIdOrSlug,
  Project,
  ProjectFilters,
} from "@/api/projectApi";

const generateFiltersKey = (filters: ProjectFilters = {}) =>
  JSON.stringify(filters, Object.keys(filters).sort());

export const useProjectsQuery = (filters: ProjectFilters = {}) => {
  const filtersKey = generateFiltersKey(filters);

  const query = useQuery<Project[]>({
    queryKey: ["projects", filtersKey],
    queryFn: () => fetchProjects(filters),
  });

  return {
    ...query,
    projects: query.data ?? [],
  };
};

export const useProjectQuery = (identifier?: string) => {
  const query = useQuery<Project | null>({
    queryKey: ["project", identifier],
    queryFn: () => fetchProjectByIdOrSlug(identifier!),
    enabled: !!identifier,
  });

  return {
    ...query,
    project: query.data ?? null,
  };
};
