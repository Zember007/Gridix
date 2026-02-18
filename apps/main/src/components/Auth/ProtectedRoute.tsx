import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { addLanguageToPath, getLanguageFromPath } from "@gridix/utils/lib";
import { supabase } from "@gridix/utils/api";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import { hasUserPassword, hasAuthTokensInHash } from "@gridix/utils";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
}: ProtectedRouteProps) => {
  const { user, loading, requiresPasswordSetup } = useAuth();
  const location = useLocation();
  const [passwordGateLoading, setPasswordGateLoading] = useState(false);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);
  const passwordCheckCacheRef = useRef<Map<string, boolean>>(new Map());
  const currentLanguage = useMemo(
    () => getLanguageFromPath(location.pathname),
    [location.pathname],
  );

  // Если открылись из amoCRM без SSO — сохраняем параметры установки в localStorage,
  // чтобы не потерять их при редиректе на /auth/signup
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const amoInstall = sp.get("amo_install") === "1";
      const amoAccountId = sp.get("amo_account_id");
      const amoUserId = sp.get("amo_user_id");
      const amoSubdomain = sp.get("amo_subdomain");

      if (!amoInstall && !amoAccountId && !amoUserId && !amoSubdomain) return;

      const payload = {
        amo_install: amoInstall ? "1" : "0",
        amo_account_id: amoAccountId,
        amo_user_id: amoUserId,
        amo_subdomain: amoSubdomain,
        captured_at: new Date().toISOString(),
      };
      localStorage.setItem("pending_amocrm_install", JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to persist amoCRM install params:", e);
    }
  }, [location.search]);

  // Проверяем, требуется ли установка пароля (через RPC, без localStorage хаков).
  // ВАЖНО: этот useEffect должен быть до любых ранних return'ов,
  // иначе нарушится порядок хуков при изменении `loading`.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (loading || !requireAuth || !user?.id) {
        setNeedsPasswordSet(false);
        setPasswordGateLoading(false);
        return;
      }
      try {
        const cacheKey = `has_password:${user.id}`;
        const cachedHasPassword = passwordCheckCacheRef.current.get(user.id);
        const storedHasPassword =
          typeof window !== "undefined"
            ? window.sessionStorage.getItem(cacheKey)
            : null;

        if (cachedHasPassword !== undefined) {
          setNeedsPasswordSet(!cachedHasPassword || requiresPasswordSetup);
          setPasswordGateLoading(false);
          return;
        }

        if (storedHasPassword === "true" || storedHasPassword === "false") {
          const hasPassword = storedHasPassword === "true";
          passwordCheckCacheRef.current.set(user.id, hasPassword);
          setNeedsPasswordSet(!hasPassword || requiresPasswordSetup);
          setPasswordGateLoading(false);
          return;
        }

        setPasswordGateLoading(true);
        const hasPassword = await hasUserPassword(supabase as any);

        if (!cancelled) {
          passwordCheckCacheRef.current.set(user.id, hasPassword);
          if (typeof window !== "undefined") {
            window.sessionStorage.setItem(cacheKey, String(hasPassword));
          }
          setNeedsPasswordSet(!hasPassword || requiresPasswordSetup);
        }
      } catch (e) {
        // If RPC fails, fall back to requiresPasswordSetup only.
        if (!cancelled) setNeedsPasswordSet(!!requiresPasswordSetup);
      } finally {
        if (!cancelled) setPasswordGateLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [loading, requireAuth, user?.id, requiresPasswordSetup]);

  if (loading) {
    return <FullPageLoaderView />;
  }

  // Редиректим на отдельное приложение авторизации (VITE_SSO_URL) или на локальный /auth.
  if (requireAuth && !user) {
    // В URL уже есть токены (hash или ?code=) — не редиректим на SSO, даём время применить сессию.
    if (
      typeof window !== "undefined" &&
      (hasAuthTokensInHash() ||
        new URLSearchParams(location.search).get("code"))
    ) {
      return <FullPageLoaderView />;
    }

    const amoParams = new URLSearchParams(location.search);
    const hasAmoInstall =
      amoParams.get("amo_install") === "1" ||
      amoParams.has("amo_account_id") ||
      amoParams.has("amo_user_id") ||
      amoParams.has("amo_subdomain");

    const ssoBase = (import.meta as any).env?.VITE_SSO_URL as
      | string
      | undefined;
    if (typeof ssoBase === "string" && ssoBase.trim()) {
      const base = ssoBase.trim().endsWith("/")
        ? ssoBase.trim().slice(0, -1)
        : ssoBase.trim();
      const fullCurrent =
        window.location.origin + location.pathname + (location.search || "");

      // Полный редирект на другое приложение (не Navigate — иначе остаёмся на том же origin).
      const ssoToken = amoParams.get("sso");
      if (ssoToken) {
        const withoutSso = new URL(fullCurrent);
        withoutSso.searchParams.delete("sso");
        window.location.replace(
          `${base}/${currentLanguage}/auth/callback?sso=${encodeURIComponent(ssoToken)}&redirect_to=${encodeURIComponent(withoutSso.toString())}`,
        );
        return <FullPageLoaderView />;
      }

      const authPath = hasAmoInstall ? "auth/signup" : "auth";
      window.location.replace(
        `${base}/${currentLanguage}/${authPath}?redirect_to=${encodeURIComponent(fullCurrent)}`,
      );
      return <FullPageLoaderView />;
    }

    // VITE_SSO_URL не задан: редирект на локальные страницы авторизации в main (legacy).
    const authPath = addLanguageToPath(
      hasAmoInstall ? "/auth/signup" : "/auth",
      currentLanguage,
    );
    const redirectValue = location.pathname + (location.search || "");
    return (
      <Navigate
        to={`${authPath}?redirect=${encodeURIComponent(redirectValue)}`}
        replace
      />
    );
  }

  if (requireAuth && user) {
    if (passwordGateLoading) return <FullPageLoaderView />;
    if (needsPasswordSet) {
      const setPasswordPath = addLanguageToPath(
        "/set-password",
        currentLanguage,
      );
      return (
        <Navigate
          to={`${setPasswordPath}?redirect=${encodeURIComponent(location.pathname)}`}
          replace
        />
      );
    }
  }

  return <>{children}</>;
};
