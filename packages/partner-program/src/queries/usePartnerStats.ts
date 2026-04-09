import { useState, useEffect } from "react";
import { useCurrentSession } from "@gridix/utils";
import { supabase } from "@gridix/utils/api";
import type { PartnerStats } from "../model/types";
import { applyDemoPartnerStatsOverlay } from "../model/demoPartnerPublicMock";

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

async function fetchIsDemoPartnerUser(
  userId: string | null | undefined,
): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase
    .from("user_profiles")
    .select("is_demo")
    .eq("id", userId)
    .maybeSingle();
  return Boolean((data as { is_demo?: boolean } | null)?.is_demo);
}

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
  const { data: sessionQuery } = useCurrentSession();

  const cacheKey = getPartnerStatsCacheKey(partnerId);

  const fetchStats = async ({ force = false }: { force?: boolean } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const userId = sessionQuery?.user?.id;
      const isDemo = await fetchIsDemoPartnerUser(userId);
      const cacheKeyFull = `${cacheKey}:${userId ?? "anon"}:${isDemo ? "demo" : "live"}`;

      const cached = partnerStatsCache.get(cacheKeyFull);
      if (!force && cached && isFreshEntry(cached)) {
        setStats(cached.data);
        return;
      }

      const nextStats = await fetchPartnerStats(partnerId);
      const merged = applyDemoPartnerStatsOverlay(nextStats, isDemo);
      partnerStatsCache.set(cacheKeyFull, {
        data: merged,
        updatedAt: Date.now(),
      });
      setStats(merged);
    } catch (err) {
      console.error("Error fetching partner stats:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStats();
  }, [partnerId, sessionQuery?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    stats,
    loading,
    error,
    refetch: () => fetchStats({ force: true }),
  };
}
