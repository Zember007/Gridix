import { supabase } from "@gridix/utils/api";

type PendingReferral = {
  partnerCode?: string;
  invitationCode?: string;
  invitationType?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  timestamp?: number;
};

const STORAGE_KEY = "pending_referral";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Handles pending referral data saved in localStorage before auth.
 * Intended to be called after a valid session is established.
 */
export async function processPendingReferralAfterAuth(): Promise<void> {
  if (typeof window === "undefined") return;

  const isSuccessResponse = (data: unknown): boolean => {
    if (!data || typeof data !== "object") return false;
    return (
      "success" in data &&
      (data as { success?: unknown }).success === true
    );
  };

  try {
    const pendingReferralStr = window.localStorage.getItem(STORAGE_KEY);
    if (!pendingReferralStr) return;

    const pendingReferral = JSON.parse(pendingReferralStr) as PendingReferral;
    const {
      partnerCode,
      invitationCode,
      invitationType,
      utmSource,
      utmMedium,
      utmCampaign,
      timestamp,
    } = pendingReferral;

    if (!partnerCode || !timestamp || Date.now() - timestamp >= MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (invitationCode && invitationType === "managed") {
      const { data, error } = await supabase.functions.invoke("partner-program", {
        body: {
          action: "track_referral",
          partner_code: partnerCode,
          invitation_code: invitationCode,
          invitation_type: "managed",
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        },
      });

      if (error) {
        console.error("Error processing invitation (after auth):", error);
        return;
      }

      if (isSuccessResponse(data)) {
        window.localStorage.removeItem(STORAGE_KEY);
      }

      return;
    }

    const { data, error } = await supabase.functions.invoke("partner-program", {
      body: {
        action: "track_referral",
        partner_code: partnerCode,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      },
    });

    if (error) {
      console.error("Error tracking referral (after auth):", error);
      return;
    }

    if (isSuccessResponse(data)) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error("Error processing referral from localStorage (after auth):", err);
  }
}


