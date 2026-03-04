import { useQuery } from "@tanstack/react-query";
import {
  getAgentContractSettings,
  listMySignedContracts,
} from "../api/contract-api";

export function useAgentContractSettings(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["agent", "settings", "contract", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      if (!applicationId) return null;
      return getAgentContractSettings(applicationId);
    },
  });
}

export function useMySignedContracts(applicationId: string | undefined) {
  return useQuery({
    queryKey: ["agent", "settings", "signed-contracts", applicationId],
    enabled: !!applicationId,
    queryFn: async () => {
      if (!applicationId) return [];
      return listMySignedContracts(applicationId);
    },
  });
}
