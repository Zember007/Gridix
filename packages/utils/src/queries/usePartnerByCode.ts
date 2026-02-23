import { useQuery } from "@tanstack/react-query";
import { fetchPartnerByCode } from "../api/partnerReferral";

export function usePartnerByCode(refCode: string | null) {
  return useQuery({
    queryKey: ["partner", refCode],
    queryFn: () => fetchPartnerByCode(refCode as string),
    enabled: Boolean(refCode),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
