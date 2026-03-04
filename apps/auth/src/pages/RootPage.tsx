import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { supabase, supabaseAuthInitPromise } from "@gridix/utils/api";
import {
  hasAuthTokensInHash,
  consumeSupabaseSessionFromUrl,
  useCurrentSession,
} from "@gridix/utils";
import { redirectToAppByAccountType } from "@/shared/lib/redirectByAccountType";

/**
 * Handles root path "/". When Supabase redirects after magic link / OAuth
 * to `/#access_token=...&refresh_token=...`, we consume the hash (here and/or
 * in supabaseAuthInitPromise), then redirect to the appropriate app by account_type.
 */
export default function RootPage() {
  const location = useLocation();
  const [action, setAction] = useState<"loading" | "redirect" | "to-auth">(
    "loading",
  );
  const { lang } = useParams();
  const {
    data: sessionQuery,
    isLoading: isSessionLoading,
    refetch: refetchSession,
  } = useCurrentSession();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const hasTokens = hasAuthTokensInHash();

      // Consume tokens from hash immediately when landing on / with magic link / OAuth callback.
      if (hasTokens) {
        await consumeSupabaseSessionFromUrl(supabase);
        if (cancelled) return;
      }

      try {
        await supabaseAuthInitPromise;
      } catch (e) {
        console.error("Auth init failed:", e);
      }
      if (cancelled) return;

      // Give the client a moment to persist session after setSession, then refetch query (with one retry)
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled) return;
      let session = (await refetchSession()).data?.session ?? null;
      if (!session?.user?.id) {
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
        session = (await refetchSession()).data?.session ?? null;
      }
      if (cancelled) return;

      if (!session?.user?.id && !isSessionLoading && sessionQuery?.session) {
        session = sessionQuery.session;
      }

      if (session?.user?.id) {
        try {
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("account_type, full_name, company_name")
            .eq("id", session.user.id)
            .maybeSingle();

          const isProfileValid =
            profile &&
            profile.account_type &&
            profile.full_name &&
            (profile.account_type !== "developer" || profile.company_name);

          const currentLang =
            lang || window.location.pathname.split("/")[1] || "en";

          if (!isProfileValid) {
            window.location.replace(
              `/${currentLang}/auth/complete-profile#${new URLSearchParams({
                access_token: session.access_token,
                refresh_token: session.refresh_token ?? "",
              }).toString()}`,
            );
            return;
          }

          await redirectToAppByAccountType(supabase, session, {
            lang: currentLang,
          });
          setAction("redirect");
        } catch (e) {
          console.error(e);
          setAction("to-auth");
        }
      } else {
        setAction("to-auth");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [isSessionLoading, lang, refetchSession, sessionQuery?.session]);

  if (action === "to-auth") {
    const nextLang = lang || "en";
    return (
      <Navigate
        replace
        to={{
          pathname: `/${nextLang}/auth/signin`,
          search: location.search,
          hash: location.hash,
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-sm text-slate-600">Processing login…</div>
    </div>
  );
}
