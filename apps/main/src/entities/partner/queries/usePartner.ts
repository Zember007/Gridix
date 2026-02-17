import { useCallback, useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import type { PartnerProfile } from "../model/types";

interface CachedPartnerState {
  isPartner: boolean;
  partnerProfile: PartnerProfile | null;
}

const partnerStateCache = new Map<string, CachedPartnerState>();
const partnerRequestInFlight = new Map<string, Promise<CachedPartnerState>>();

export function usePartner() {
  const { user } = useAuth();
  const [isPartner, setIsPartner] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const checkPartnerStatus = useCallback(async () => {
    try {
      if (!user?.id) {
        setIsPartner(false);
        setPartnerProfile(null);
        setLoading(false);
        return;
      }

      const cached = partnerStateCache.get(user.id);
      if (cached) {
        setIsPartner(cached.isPartner);
        setPartnerProfile(cached.partnerProfile);
        setLoading(false);
        return;
      }

      const inFlight = partnerRequestInFlight.get(user.id);
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
          .eq("user_id", user.id)
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

      partnerRequestInFlight.set(user.id, request);
      const nextState = await request;
      partnerStateCache.set(user.id, nextState);
      setIsPartner(nextState.isPartner);
      setPartnerProfile(nextState.partnerProfile);
    } catch (error) {
      console.error("Error checking partner status:", error);
      setIsPartner(false);
      setPartnerProfile(null);
    } finally {
      if (user?.id) {
        partnerRequestInFlight.delete(user.id);
      }
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void checkPartnerStatus();
  }, [checkPartnerStatus]);

  const createPartnerProfile = async () => {
    try {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Генерируем партнёрский код
      const { data: codeData, error: codeError } = await supabase.rpc(
        "generate_partner_code" as any,
        { user_id_param: user.id },
      );

      if (codeError) {
        throw new Error("Failed to generate partner code");
      }

      const { data: profile, error: profileError } = await supabase
        .from("partner_profiles" as any)
        .insert({
          user_id: user.id,
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

      partnerStateCache.set(user.id, nextState);
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
