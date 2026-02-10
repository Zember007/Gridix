import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase, supabaseAuthInitPromise } from "@gridix/utils/api";
import { redirectToAppByAccountType } from "@/shared/lib/redirectByAccountType";

/**
 * Handles root path "/". When Supabase redirects after magic link / OAuth
 * to `/#access_token=...&refresh_token=...`, the session is consumed by
 * supabaseAuthInitPromise. Here we wait for init, then redirect to the
 * appropriate app (main or agent) by account_type; otherwise go to /auth.
 */
export default function RootPage() {
  const [action, setAction] = useState<"loading" | "redirect" | "to-auth">("loading");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await supabaseAuthInitPromise;
      if (cancelled) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.user?.id) {
        try {
          await redirectToAppByAccountType(supabase, session, {
            lang: window.location.pathname.split("/")[1] || "en",
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
  }, []);

  if (action === "to-auth") {
    return <Navigate replace to="/auth" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-sm text-slate-600">Processing login…</div>
    </div>
  );
}
