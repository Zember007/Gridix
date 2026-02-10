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

export default function CallbackPage() {
  const [sp] = useSearchParams();
  const redirectToUrl = sp.get("redirect_to");
  const ssoToken = sp.get("sso");

  useEffect(() => {
    const run = async () => {
      try {
        if (ssoToken?.trim()) {
          await exchangeAmoSsoToken(supabase as unknown as AmoSsoSupabaseClient, ssoToken.trim());
        }
        await consumeSupabaseSessionFromUrl(supabase);
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session?.user?.id) throw new Error("No session after callback");

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-sm text-slate-600">Processing login…</div>
    </div>
  );
}

