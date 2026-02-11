import { useEffect, useMemo, useState } from "react";
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
      (import.meta as any).env?.VITE_PARTNERS_APP_URL,
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
  const partnersAppUrl = (import.meta as any).env?.VITE_PARTNERS_APP_URL || "https://partner.gridix.live";

  let targetBase: string;
  if (accountType === "agent") {
    targetBase = agentCabinetUrl;
  } else if (accountType === "partner") {
    targetBase = partnersAppUrl;
  } else {
    targetBase = mainAppUrl;
  }

  const safe = safeRedirectUrl(params.redirectToUrl ?? null);
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: "bearer",
    type: "magiclink",
  }).toString();

  if (safe) {
    const u = new URL(safe);
    const mainOrigin = new URL(mainAppUrl).origin;
    const agentOrigin = new URL(agentCabinetUrl).origin;
    const partnersOrigin = new URL(partnersAppUrl).origin;

    // Guard: prevent cross-account-type redirects
    const isAgentTarget = u.origin === agentOrigin;
    const isMainTarget = u.origin === mainOrigin;
    const isPartnerTarget = u.origin === partnersOrigin;

    const wrongTarget =
      (isAgentTarget && accountType !== "agent") ||
      (isMainTarget && (accountType === "agent" || accountType === "partner")) ||
      (isPartnerTarget && accountType !== "partner");

    if (!wrongTarget) {
      const base = `${u.origin}${u.pathname}${u.search}`;
      window.location.href = `${base}#${hash}`;
      return;
    }
  }

  // Default landing
  let defaultPath: string;
  if (accountType === "agent") {
    defaultPath = `${targetBase}/${params.lang}/`;
  } else if (accountType === "partner") {
    defaultPath = `${targetBase}/${params.lang}/`;
  } else {
    defaultPath = `${targetBase}/${params.lang}/admin`;
  }
  window.location.href = `${defaultPath}#${hash}`;
}

export default function AuthPage() {
  const { navigate } = useLanguageNavigation();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const redirectToUrl = searchParams.get("redirect_to");
  const mode = searchParams.get("mode");
  const [isRecovery, setIsRecovery] = useState(false);

  const [loading] = useState(false);

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

  if (loading) return <FullPageLoaderView />;

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

