import { useQuery } from "@tanstack/react-query";
import {
  getAgentContractSettings,
  getMyUserProfile,
  listMySignedContracts,
} from "../api/settings-api";

export function useMyUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["agent", "settings", "profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      return getMyUserProfile(userId);
    },
  });
}

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
