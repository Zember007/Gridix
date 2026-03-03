import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getLanguageFromPath,
  addLanguageToPath,
  removeLanguageFromPath,
} from "@gridix/utils/lib";
import { useAuth } from "@/shared/lib/auth";
import { useLanguage } from "@/shared/lib/language";
import { supabase } from "@gridix/utils/api";
import { hasAuthTokensInHash, hasUserPassword } from "@gridix/utils";

export function ProtectedRoute({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const lang = useMemo(
    () => getLanguageFromPath(location.pathname),
    [location.pathname],
  );
  const hasCodeInUrl = useMemo(() => {
    try {
      return new URLSearchParams(location.search).has("code");
    } catch {
      return false;
    }
  }, [location.search]);

  const [passwordGateLoading, setPasswordGateLoading] = useState(false);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!user?.id) {
        setNeedsPasswordSet(false);
        setPasswordGateLoading(false);
        return;
      }
      try {
        setPasswordGateLoading(true);
        const hasPassword = await hasUserPassword(supabase as never);
        if (cancelled) return;
        setNeedsPasswordSet(!hasPassword);
      } catch {
        if (!cancelled) setNeedsPasswordSet(false);
      } finally {
        if (!cancelled) setPasswordGateLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading) return null;
  if (!requireAuth) return <>{children}</>;
  if (user) {
    if (passwordGateLoading) return null;
    const isOnSetPassword = removeLanguageFromPath(
      location.pathname,
    ).startsWith("/set-password");
    if (needsPasswordSet && !isOnSetPassword) {
      const redirectTo = addLanguageToPath("/set-password", lang);
      const clean = removeLanguageFromPath(location.pathname);
      return (
        <Navigate
          to={`${redirectTo}?next=${encodeURIComponent(clean + location.search)}`}
          replace
        />
      );
    }
    return <>{children}</>;
  }

  if (
    typeof window !== "undefined" &&
    (hasAuthTokensInHash() || hasCodeInUrl)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="text-sm text-slate-600">
          {t("common.auth.processingLogin")}
        </div>
      </div>
    );
  }

  const ssoBase =
    (import.meta as { env?: { VITE_SSO_URL?: string } }).env?.VITE_SSO_URL ||
    "https://sso.gridix.live";
  const returnUrl = window.location.href;
  const ssoUrl = `${ssoBase}/${lang}/auth?redirect_to=${encodeURIComponent(returnUrl)}`;
  window.location.replace(ssoUrl);
  return null;
}
