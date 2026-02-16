import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@gridix/utils/api";
import {
  consumeSupabaseSessionFromUrl,
  exchangeAmoSsoToken,
} from "@gridix/utils";
import type { AmoSsoSupabaseClient } from "@gridix/utils";
import { redirectToAppByAccountType } from "@/shared/lib/redirectByAccountType";
import { toast } from "sonner";

const LS_PENDING_ACCOUNT_TYPE = "gridix_auth_pending_account_type";
const LS_PENDING_REF = "gridix_auth_pending_ref";
const LS_PENDING_INVITE = "gridix_auth_pending_invite";

export default function CallbackPage() {
  const [sp] = useSearchParams();
  const redirectToUrl = sp.get("redirect_to");
  const ssoToken = sp.get("sso");

  useEffect(() => {
    const run = async () => {
      try {
        if (ssoToken?.trim()) {
          await exchangeAmoSsoToken(
            supabase as unknown as AmoSsoSupabaseClient,
            ssoToken.trim(),
          );
        }
        await consumeSupabaseSessionFromUrl(supabase);
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session?.user?.id) throw new Error("No session after callback");

        // Apply pending account type selection (Google OAuth flow)
        try {
          const pendingAccountType = localStorage.getItem(
            LS_PENDING_ACCOUNT_TYPE,
          );
          const pendingRef = localStorage.getItem(LS_PENDING_REF);
          const pendingInvite = localStorage.getItem(LS_PENDING_INVITE);

          if (pendingAccountType) {
            // Ensure user_profiles has correct account_type for redirect logic
            const { error: upsertError } = await supabase
              .from("user_profiles")
              .upsert(
                {
                  id: session.user.id,
                  account_type: pendingAccountType,
                } as any,
                { onConflict: "id" },
              );
            if (upsertError) {
              console.error(
                "Failed to upsert user_profiles.account_type:",
                upsertError,
              );
            }
          }

          if (pendingRef) {
            const { data: partner, error: partnerError } = await supabase
              .from("partner_profiles")
              .select("id")
              .eq("partner_code", pendingRef)
              .maybeSingle();
            if (!partnerError && partner?.id) {
              const { error: linkError } = await supabase
                .from("partner_links")
                .insert({
                  partner_id: partner.id,
                  client_id: session.user.id,
                  type: "referral",
                  status: "active",
                  accepted_at: new Date().toISOString(),
                } as any);
              if (linkError)
                console.error(
                  "Error creating partner link (oauth):",
                  linkError,
                );
            }
          }

          if (pendingInvite && session.user.email) {
            const { error: inviteError } = await supabase
              .from("partner_invitations")
              .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
              } as any)
              .eq("invitation_code", pendingInvite)
              .eq("email", session.user.email);
            if (inviteError)
              console.error("Error updating invitation (oauth):", inviteError);
          }

          localStorage.removeItem(LS_PENDING_ACCOUNT_TYPE);
          localStorage.removeItem(LS_PENDING_REF);
          localStorage.removeItem(LS_PENDING_INVITE);
        } catch (e) {
          // Storage might be unavailable (private mode). Don't block login.
          console.warn("Pending OAuth data apply failed:", e);
        }

        await redirectToAppByAccountType(supabase, session, {
          redirectToUrl: redirectToUrl ?? null,
          lang: window.location.pathname.split("/")[1] || "en",
        });
      } catch (e) {
        const err = e as { message?: string };
        console.error(e);
        toast.error(err?.message ?? "Callback failed");
      }
    };
    void run();
  }, [redirectToUrl, ssoToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-sm text-slate-600">Processing login…</div>
    </div>
  );
}
