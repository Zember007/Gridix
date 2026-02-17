import { useState, useEffect } from "react";
import { supabase } from "@gridix/utils/api";
import type { PartnerStats } from "../model/types";

export function usePartnerStats(partnerId?: string) {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

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

      setStats(data);
    } catch (err) {
      console.error("Error fetching partner stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [partnerId]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
