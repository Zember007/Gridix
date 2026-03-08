import { useState, useEffect } from "react";
import { supabase } from "@gridix/utils/api";
import type { PartnerStats } from "../model/types";

const PARTNER_STATS_STALE_TIME_MS = 60_000;
const DEFAULT_PARTNER_KEY = "__default_partner__";

type PartnerStatsCacheEntry = {
  data: PartnerStats;
  updatedAt: number;
};

const partnerStatsCache = new Map<string, PartnerStatsCacheEntry>();
const inFlightPartnerStats = new Map<string, Promise<PartnerStats>>();

const getPartnerStatsCacheKey = (partnerId?: string) =>
  partnerId || DEFAULT_PARTNER_KEY;

const isFreshEntry = (entry: PartnerStatsCacheEntry) =>
  Date.now() - entry.updatedAt < PARTNER_STATS_STALE_TIME_MS;

const fetchPartnerStats = async (partnerId?: string): Promise<PartnerStats> => {
  const key = getPartnerStatsCacheKey(partnerId);
  const inFlight = inFlightPartnerStats.get(key);
  if (inFlight) {
    return inFlight;
  }

  const request = (async () => {
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
  })();

  inFlightPartnerStats.set(key, request);

  try {
    return await request;
  } finally {
    inFlightPartnerStats.delete(key);
  }
};

export function usePartnerStats(partnerId?: string) {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = getPartnerStatsCacheKey(partnerId);

  const fetchStats = async ({ force = false }: { force?: boolean } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const cached = partnerStatsCache.get(cacheKey);
      if (!force && cached && isFreshEntry(cached)) {
        setStats(cached.data);
        return;
      }

      const nextStats = await fetchPartnerStats(partnerId);
      partnerStatsCache.set(cacheKey, {
        data: nextStats,
        updatedAt: Date.now(),
      });
      setStats(nextStats);
    } catch (err) {
      console.error("Error fetching partner stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, [partnerId]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    stats,
    loading,
    error,
    refetch: () => fetchStats({ force: true }),
  };
}
