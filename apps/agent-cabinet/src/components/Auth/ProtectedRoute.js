import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  getLanguageFromPath,
  addLanguageToPath,
  removeLanguageFromPath,
} from "@gridix/utils/lib";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@gridix/utils/api";
import { hasAuthTokensInHash, hasUserPassword } from "@gridix/utils";
export function ProtectedRoute({ children, requireAuth = true }) {
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
        const hasPassword = await hasUserPassword(supabase);
        if (cancelled) return;
        setNeedsPasswordSet(!hasPassword);
      } catch {
        // If we can't determine the state, don't block access.
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
  if (!requireAuth) return _jsx(_Fragment, { children: children });
  if (user) {
    if (passwordGateLoading) return null;
    const isOnSetPassword = removeLanguageFromPath(
      location.pathname,
    ).startsWith("/set-password");
    if (needsPasswordSet && !isOnSetPassword) {
      const redirectTo = addLanguageToPath("/set-password", lang);
      const clean = removeLanguageFromPath(location.pathname);
      return _jsx(Navigate, {
        to: `${redirectTo}?next=${encodeURIComponent(clean + location.search)}`,
        replace: true,
      });
    }
    return _jsx(_Fragment, { children: children });
  }
  // Not authenticated but URL contains auth tokens/code:
  // don't hard-redirect to SSO yet — allow app init to consume session first.
  if (
    typeof window !== "undefined" &&
    (hasAuthTokensInHash() || hasCodeInUrl)
  ) {
    return _jsx("div", {
      className:
        "flex min-h-screen items-center justify-center bg-slate-50 p-6",
      children: _jsx("div", {
        className: "text-sm text-slate-600",
        children: t("common.auth.processingLogin"),
      }),
    });
  }
  // Not authenticated -> redirect to global SSO.
  // (Auth flow will be migrated out of this app.)
  const ssoBase = import.meta.env?.VITE_SSO_URL || "https://sso.gridix.live";
  // We must use a hard redirect for external domain.
  // Keep current URL as return target.
  const returnUrl = window.location.href;
  // Route into the auth app, not the domain root.
  const ssoUrl = `${ssoBase}/${lang}/auth?redirect_to=${encodeURIComponent(returnUrl)}`;
  window.location.replace(ssoUrl);
  return null;
}
