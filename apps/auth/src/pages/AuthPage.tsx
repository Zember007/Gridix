import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@gridix/utils/api";
import { useLanguageNavigation } from "@gridix/utils/react";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";
import { AuthForm } from "@/components/Auth/AuthForm";

function safeRedirectUrl(input: string | null): string | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    const allowed = new Set([
      (import.meta as any).env?.VITE_MAIN_APP_URL,
      (import.meta as any).env?.VITE_AGENT_CABINET_URL,
    ].filter(Boolean));
    // allow same-origin and known app bases
    if (u.origin === window.location.origin) return u.toString();
    for (const base of allowed) {
      const b = String(base);
      if (b && u.origin === new URL(b).origin) return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

async function redirectByAccountType(params: { redirectToUrl?: string | null; lang: string }) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const userId = session.user.id;
  const { data: profile } = await supabase.from("user_profiles").select("account_type").eq("id", userId).maybeSingle();
  const accountType = typeof (profile as any)?.account_type === "string" ? String((profile as any).account_type) : "developer";

  const mainAppUrl = (import.meta as any).env?.VITE_MAIN_APP_URL || "https://app.gridix.live";
  const agentCabinetUrl = (import.meta as any).env?.VITE_AGENT_CABINET_URL || "https://agent.gridix.live";

  const targetBase = accountType === "agent" ? agentCabinetUrl : mainAppUrl;

  const safe = safeRedirectUrl(params.redirectToUrl ?? null);
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: "bearer",
    type: "magiclink",
  }).toString();

  if (safe) {
    const u = new URL(safe);
    const base = `${u.origin}${u.pathname}${u.search}`;
    window.location.href = `${base}#${hash}`;
    return;
  }

  // Default landing
  const defaultPath = accountType === "agent" ? `${targetBase}/${params.lang}/` : `${targetBase}/${params.lang}/admin`;
  window.location.href = `${defaultPath}#${hash}`;
}

export default function AuthPage() {
  const { navigate } = useLanguageNavigation();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const redirectToUrl = searchParams.get("redirect_to");
  const mode = searchParams.get("mode");
  const [isRecovery, setIsRecovery] = useState(false);

  const [loading, setLoading] = useState(true);
  const [userReady, setUserReady] = useState(false);

  const isSignup = location.pathname.includes("/signup");
  const isSignin = location.pathname.includes("/signin");

  const hashIndicatesRecovery = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash || "";
    return /type=recovery/.test(hash);
  }, []);

  useEffect(() => {
    if (mode === "recovery" || hashIndicatesRecovery) setIsRecovery(true);
  }, [mode, hashIndicatesRecovery]);

  // Observe session and redirect after login.
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        if (data.session?.user) {
          setUserReady(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      if (nextSession?.user) setUserReady(true);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const redirectingRef = useRef(false);
  useEffect(() => {
    if (!userReady || isRecovery) return;
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    void redirectByAccountType({ redirectToUrl, lang: (window.location.pathname.split("/")[1] || "en") });
  }, [userReady, redirectToUrl, isRecovery]);

  if (loading) return <FullPageLoaderView />;
  if (userReady && !isRecovery) return null;

  return isRecovery ? (
    <ResetPasswordForm
      onSuccess={() => {
        if (typeof window !== "undefined") window.location.hash = "";
        navigate("/auth");
      }}
    />
  ) : (
    <AuthForm
      defaultMode={isSignup ? "signup" : isSignin ? "signin" : undefined}
      onSuccess={() => {
        void redirectByAccountType({ redirectToUrl, lang: (window.location.pathname.split("/")[1] || "en") });
      }}
    />
  );
}

