import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadSelectorFacade } from "@/features/projectSelector/api/projectSelectorApi";
import type {
  BuildingFloor,
  FacadeSettings,
} from "@/features/visualization/buildingFacade/model/types";
import type { ProjectFacade } from "../types";

// ── Hook ──

interface UseFacadeDataParams {
  projectId: string | undefined;
  subProjectId?: string;
  /** Only load facade data when the facade view is active. */
  enabled: boolean;
}

interface UseFacadeDataResult {
  facades: ProjectFacade[];
  facadesLoaded: boolean;
  floorsByFacadeId: Record<string, BuildingFloor[]>;
  floorsLoading: boolean;
  floorsLoaded: boolean;
  facadeSettings: FacadeSettings | null;
  settingsLoading: boolean;
  settingsLoaded: boolean;
}

export const useFacadeData = ({
  projectId,
  subProjectId,
  enabled,
}: UseFacadeDataParams): UseFacadeDataResult => {
  const queryEnabled = !!projectId && enabled;

  const facadeQuery = useQuery({
    queryKey: ["project-selector", "facade", projectId, subProjectId],
    queryFn: () => loadSelectorFacade(projectId!, subProjectId),
    enabled: queryEnabled,
  });

  return useMemo(
    () => ({
      facades: facadeQuery.data?.facades ?? [],
      facadesLoaded: !facadeQuery.isLoading,
      floorsByFacadeId:
        (facadeQuery.data?.floorsByFacadeId as Record<
          string,
          BuildingFloor[]
        >) ?? {},
      floorsLoading: facadeQuery.isFetching,
      floorsLoaded: !facadeQuery.isLoading,
      facadeSettings: facadeQuery.data?.facadeSettings ?? null,
      settingsLoading: facadeQuery.isFetching,
      settingsLoaded: !facadeQuery.isLoading,
    }),
    [
      facadeQuery.data?.facades,
      facadeQuery.data?.floorsByFacadeId,
      facadeQuery.data?.facadeSettings,
      facadeQuery.isLoading,
      facadeQuery.isFetching,
    ],
  );
};
