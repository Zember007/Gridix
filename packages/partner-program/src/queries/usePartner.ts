import { useCallback, useEffect, useState } from "react";
import { useCurrentSession } from "@gridix/utils";
import { supabase } from "@gridix/utils/api";
import type { PartnerProfile } from "../model/types";

interface CachedPartnerState {
  isPartner: boolean;
  partnerProfile: PartnerProfile | null;
}

const partnerStateCache = new Map<string, CachedPartnerState>();
const partnerRequestInFlight = new Map<string, Promise<CachedPartnerState>>();

export function usePartner() {
  const [isPartner, setIsPartner] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const { data: sessionQuery, isLoading: isSessionLoading } =
    useCurrentSession();

  const checkPartnerStatus = useCallback(async () => {
    let userId: string | null = null;

    try {
      if (isSessionLoading) return;
      userId = sessionQuery?.user?.id ?? null;

      if (!userId) {
        setIsPartner(false);
        setPartnerProfile(null);
        setLoading(false);
        return;
      }

      const cached = partnerStateCache.get(userId);
      if (cached) {
        setIsPartner(cached.isPartner);
        setPartnerProfile(cached.partnerProfile);
        setLoading(false);
        return;
      }

      const inFlight = partnerRequestInFlight.get(userId);
      if (inFlight) {
        const state = await inFlight;
        setIsPartner(state.isPartner);
        setPartnerProfile(state.partnerProfile);
        setLoading(false);
        return;
      }

      const request = (async (): Promise<CachedPartnerState> => {
        const { data: profile, error } = await supabase
          .from("partner_profiles" as any)
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        if (profile) {
          return {
            isPartner: true,
            partnerProfile: profile as unknown as PartnerProfile,
          };
        }

        return {
          isPartner: false,
          partnerProfile: null,
        };
      })();

      partnerRequestInFlight.set(userId, request);
      const nextState = await request;
      partnerStateCache.set(userId, nextState);
      setIsPartner(nextState.isPartner);
      setPartnerProfile(nextState.partnerProfile);
    } catch (error) {
      console.error("Error checking partner status:", error);
      setIsPartner(false);
      setPartnerProfile(null);
    } finally {
      if (userId) {
        partnerRequestInFlight.delete(userId);
      }
      setLoading(false);
    }
  }, [isSessionLoading, sessionQuery?.user?.id]);

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

      const nextState: CachedPartnerState = {
        isPartner: true,
        partnerProfile: profile as unknown as PartnerProfile,
      };

      partnerStateCache.set(userId, nextState);
      setPartnerProfile(nextState.partnerProfile);
      setIsPartner(true);

      return profile;
    } catch (error) {
      console.error("Error creating partner profile:", error);
      throw error;
    }
  };

  return {
    isPartner,
    partnerProfile,
    loading,
    createPartnerProfile,
    refetch: checkPartnerStatus,
  };
}
