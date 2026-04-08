import { useQuery } from "@tanstack/react-query";
import {
  loadSelectorMasterplan,
  type SelectorMasterplanResult,
  type MasterplanListItem,
} from "@/features/projectSelector/api/projectSelectorApi";

interface UseMasterplanDataOptions {
  projectId: string | undefined;
  masterplansList: MasterplanListItem[];
  activeMasterplanId: string | undefined;
  enabled: boolean;
}

export function useMasterplanData({
  projectId,
  activeMasterplanId,
  enabled,
}: UseMasterplanDataOptions) {
  const query = useQuery<SelectorMasterplanResult>({
    queryKey: [
      "project-selector",
      "masterplan",
      projectId,
      activeMasterplanId ?? "default",
    ],
    queryFn: () => loadSelectorMasterplan(projectId!, activeMasterplanId),
    enabled: enabled && !!projectId,
  });

  return {
    masterplan: query.data?.masterplan ?? null,
    areas: query.data?.areas ?? [],
    infrastructureZones: query.data?.infrastructureZones ?? [],
    loading: query.isLoading,
  };
}
