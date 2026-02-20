import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
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
          await redirectToAppByAccountType(supabase, session, {
            lang: lang || window.location.pathname.split("/")[1] || "en",
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
    return <Navigate replace to={`/${nextLang}/auth`} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-sm text-slate-600">Processing login…</div>
    </div>
  );
}
