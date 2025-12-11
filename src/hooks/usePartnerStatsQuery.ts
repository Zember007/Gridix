import { useQuery } from "@tanstack/react-query";
import { fetchPartnerStats } from "@/api/partnerApi";

export const usePartnerStatsQuery = (partnerId?: string) => {
  const query = useQuery({
    queryKey: ["partner-stats", partnerId],
    enabled: !!partnerId,
    queryFn: () => fetchPartnerStats(partnerId),
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
};
