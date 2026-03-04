import { useQuery } from "@tanstack/react-query";
import { getMyUserProfile } from "../api/profile-api";

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
