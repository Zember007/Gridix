import { useCallback, useEffect, useState } from "react";
import { useCurrentSession } from "@gridix/utils";
import { supabase } from "@gridix/utils/api";
import { usePartnerScopeUserId } from "../PartnerScopeContext";
import { fetchPartnerStats } from "../api/partnerApi";
import type { PartnerProfile, PartnerStats } from "../model/types";

interface CachedPartnerState {
  isPartner: boolean;
  partnerProfile: PartnerProfile | null;
  isDemoAccount: boolean;
}

const partnerStateCache = new Map<string, CachedPartnerState>();
const partnerRequestInFlight = new Map<string, Promise<CachedPartnerState>>();

function getPartnerCacheKey(
  sessionUserId: string,
  effectivePartnerUserId: string,
): string {
  return `${sessionUserId}|${effectivePartnerUserId}`;
}

export function usePartner() {
  const scopedPartnerUserId = usePartnerScopeUserId();
  const [isPartner, setIsPartner] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(
    null,
  );
  const [isDemoAccount, setIsDemoAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: sessionQuery, isLoading: isSessionLoading } =
    useCurrentSession();

  const checkPartnerStatus = useCallback(async () => {
    let sessionUserId: string | null = null;

    try {
      if (isSessionLoading) return;
      sessionUserId = sessionQuery?.user?.id ?? null;

      if (!sessionUserId) {
        setIsPartner(false);
        setPartnerProfile(null);
        setIsDemoAccount(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      const effectivePartnerUserId = scopedPartnerUserId ?? sessionUserId;

      const isDelegatedWorkspace =
        Boolean(scopedPartnerUserId) && scopedPartnerUserId !== sessionUserId;

      const cacheKey = getPartnerCacheKey(
        sessionUserId,
        effectivePartnerUserId,
      );

      const cached = partnerStateCache.get(cacheKey);
      if (cached) {
        setIsPartner(cached.isPartner);
        setPartnerProfile(cached.partnerProfile);
        setIsDemoAccount(cached.isDemoAccount);
        setLoading(false);
        return;
      }

      const inFlight = partnerRequestInFlight.get(cacheKey);
      if (inFlight) {
        const state = await inFlight;
        setIsPartner(state.isPartner);
        setPartnerProfile(state.partnerProfile);
        setIsDemoAccount(state.isDemoAccount);
        setLoading(false);
        return;
      }

      const request = (async (): Promise<CachedPartnerState> => {
        const { data: upRow } = await supabase
          .from("user_profiles")
          .select("is_demo")
          .eq("id", effectivePartnerUserId)
          .maybeSingle();

        const demo = Boolean((upRow as { is_demo?: boolean } | null)?.is_demo);

        if (isDelegatedWorkspace) {
          const statsPayload: PartnerStats =
            await fetchPartnerStats(scopedPartnerUserId);

          const pf = statsPayload.partner_profile ?? null;
          if (pf) {
            return {
              isPartner: true,
              partnerProfile: pf,
              isDemoAccount: demo,
            };
          }

          return {
            isPartner: false,
            partnerProfile: null,
            isDemoAccount: demo,
          };
        }

        const { data: profile, error } = await supabase
          .from("partner_profiles" as any)
          .select("*")
          .eq("user_id", effectivePartnerUserId)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (profile) {
          return {
            isPartner: true,
            partnerProfile: profile as unknown as PartnerProfile,
            isDemoAccount: demo,
          };
        }

        return {
          isPartner: false,
          partnerProfile: null,
          isDemoAccount: demo,
        };
      })();

      partnerRequestInFlight.set(cacheKey, request);
      const nextState = await request;
      partnerStateCache.set(cacheKey, nextState);
      setIsPartner(nextState.isPartner);
      setPartnerProfile(nextState.partnerProfile);
      setIsDemoAccount(nextState.isDemoAccount);
    } catch (error) {
      console.error("Error checking partner status:", error);
      setIsPartner(false);
      setPartnerProfile(null);
      setIsDemoAccount(false);
    } finally {
      if (sessionUserId) {
        const effectivePartnerUserId = scopedPartnerUserId ?? sessionUserId;
        const cacheKey = getPartnerCacheKey(
          sessionUserId,
          effectivePartnerUserId,
        );
        partnerRequestInFlight.delete(cacheKey);
      }
      setLoading(false);
    }
  }, [isSessionLoading, sessionQuery?.user?.id, scopedPartnerUserId]);

  useEffect(() => {
    void checkPartnerStatus();
  }, [checkPartnerStatus]);

  const createPartnerProfile = async () => {
    try {
      if (isSessionLoading) {
        throw new Error("Auth session is loading");
      }
      const userId = sessionQuery?.user?.id;

      if (!userId) {
        throw new Error("User not authenticated");
      }

      // Генерируем партнёрский код
      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_partner_code" as any,
        { user_id_param: userId },
      );

      if (codeError) {
        throw new Error("Failed to generate partner code");
      }

      const { data: profile, error: profileError } = await supabase
        .from("partner_profiles" as any)
        .insert({
          user_id: userId,
          partner_code: codeData,
        })
        .select()
        .single();

      if (profileError) {
        throw new Error("Failed to create partner profile");
      }

      const { data: upRow } = await supabase
        .from("user_profiles")
        .select("is_demo")
        .eq("id", userId)
        .maybeSingle();

      const nextState: CachedPartnerState = {
        isPartner: true,
        partnerProfile: profile as unknown as PartnerProfile,
        isDemoAccount: Boolean(
          (upRow as { is_demo?: boolean } | null)?.is_demo,
        ),
      };

      const effectivePartnerUserId = scopedPartnerUserId ?? userId;
      const cacheKey = getPartnerCacheKey(userId, effectivePartnerUserId);
      partnerStateCache.set(cacheKey, nextState);
      setPartnerProfile(nextState.partnerProfile);
      setIsPartner(true);
      setIsDemoAccount(nextState.isDemoAccount);

      return profile;
    } catch (error) {
      console.error("Error creating partner profile:", error);
      throw error;
    }
  };

  return {
    isPartner,
    partnerProfile,
    loading: loading || isSessionLoading,
    isDemoAccount,
    createPartnerProfile,
    refetch: checkPartnerStatus,
  };
}
