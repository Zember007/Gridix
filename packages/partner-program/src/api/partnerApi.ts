import { supabase } from "@gridix/utils/api";
import type { PartnerStats } from "../model/types";

export const fetchPartnerStats = async (
  partnerId?: string,
): Promise<PartnerStats> => {
  const { data, error: functionError } = await supabase.functions.invoke(
    "partner-program",
    {
      body: {
        action: "get_stats",
        partner_id: partnerId,
      },
    },
  );

  if (functionError) {
    throw new Error(functionError.message);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as PartnerStats;
};
