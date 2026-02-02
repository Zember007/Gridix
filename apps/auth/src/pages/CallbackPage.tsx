import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@gridix/utils/api";
import { consumeSupabaseSessionFromUrl } from "@gridix/utils";
import { exchangeAmoSsoToken } from "@gridix/utils";
import { toast } from "sonner";

function getEnv(name: string, fallback: string) {
  const v = (import.meta as any).env?.[name];
  return typeof v === "string" && v ? v : fallback;
}

export default function CallbackPage() {
  const [sp] = useSearchParams();
  const role = sp.get("role"); // optional: 'agent'
  const redirectToUrl = sp.get("redirect_to"); // optional full URL
  const ssoToken = sp.get("sso"); // optional: amo SSO token

  useEffect(() => {
    const run = async () => {
      try {
        if (ssoToken && ssoToken.trim().length > 0) {
          await exchangeAmoSsoToken(supabase as any, ssoToken.trim());
        }
        await consumeSupabaseSessionFromUrl(supabase as any);
        const { data } = await supabase.auth.getSession();
        const session = data.session;
        if (!session?.user?.id) throw new Error("No session after callback");

        const userId = session.user.id;

        // If callback was invoked for agent onboarding, ensure account_type=agent.
        if (role === "agent") {
          await supabase
            .from("user_profiles")
            .upsert(
              {
                id: userId,
                email: session.user.email ?? null,
                account_type: "agent",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "id" },
            )
            .throwOnError();
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("account_type")
          .eq("id", userId)
          .maybeSingle();

        const accountType = typeof (profile as any)?.account_type === "string" ? String((profile as any).account_type) : "developer";

        const agentCabinet = getEnv("VITE_AGENT_CABINET_URL", "https://agent.gridix.live");
        const mainApp = getEnv("VITE_MAIN_APP_URL", "https://app.gridix.live");

        // If redirect_to is provided, use it (whitelist by hostname).
        if (redirectToUrl) {
          try {
            const u = new URL(redirectToUrl);
            const allow = new Set([new URL(agentCabinet).origin, new URL(mainApp).origin]);
            if (allow.has(u.origin)) {
              const access_token = session.access_token;
              const refresh_token = session.refresh_token;
              const hash = new URLSearchParams({
                access_token,
                refresh_token,
                token_type: "bearer",
                type: "magiclink",
              }).toString();
              const base = `${u.origin}${u.pathname}${u.search}`;
              window.location.replace(`${base}#${hash}`);
              return;
            }
          } catch {
            // ignore
          }
        }

        const targetBase = accountType === "agent" ? agentCabinet : mainApp;
        const langFromUrl = window.location.pathname.split("/")[1] || "en";

        const access_token = session.access_token;
        const refresh_token = session.refresh_token;

        const hash = new URLSearchParams({
          access_token,
          refresh_token,
          token_type: "bearer",
          type: "magiclink",
        }).toString();

        window.location.replace(`${targetBase}/${langFromUrl}/#${hash}`);
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || "Callback failed");
      }
    };
    void run();
  }, [role, redirectToUrl, ssoToken]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-sm text-slate-600">Processing login…</div>
    </div>
  );
}

