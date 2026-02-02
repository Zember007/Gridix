import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addLanguageToPath, getLanguageFromPath } from "@gridix/utils/lib";
import { supabase } from "@gridix/utils/api";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import { hasUserPassword } from "@gridix/utils";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading, requiresPasswordSetup } = useAuth();
  const location = useLocation();
  const [passwordGateLoading, setPasswordGateLoading] = useState(false);
  const [needsPasswordSet, setNeedsPasswordSet] = useState(false);
  const currentLanguage = useMemo(() => getLanguageFromPath(location.pathname), [location.pathname]);

  // Если открылись из amoCRM без SSO — сохраняем параметры установки в localStorage,
  // чтобы не потерять их при редиректе на /auth/signup
  useEffect(() => {
    try {
      const sp = new URLSearchParams(location.search);
      const amoInstall = sp.get('amo_install') === '1';
      const amoAccountId = sp.get('amo_account_id');
      const amoUserId = sp.get('amo_user_id');
      const amoSubdomain = sp.get('amo_subdomain');

      if (!amoInstall && !amoAccountId && !amoUserId && !amoSubdomain) return;

      const payload = {
        amo_install: amoInstall ? '1' : '0',
        amo_account_id: amoAccountId,
        amo_user_id: amoUserId,
        amo_subdomain: amoSubdomain,
        captured_at: new Date().toISOString(),
      };
      localStorage.setItem('pending_amocrm_install', JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to persist amoCRM install params:', e);
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
        setPasswordGateLoading(true);
        const hasPassword = await hasUserPassword(supabase as any);
        if (!cancelled) setNeedsPasswordSet(!hasPassword || requiresPasswordSetup);
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

  // Редиректим на /auth только если:
  // 1. Требуется авторизация
  // 2. Пользователь не авторизован
  // 3. НЕТ SSO токена в URL (или он уже обработан)
  // 4. Обработка SSO не идет
  if (requireAuth && !user) {
    const amoParams = new URLSearchParams(location.search);
    const hasAmoInstall =
      amoParams.get('amo_install') === '1' ||
      amoParams.has('amo_account_id') ||
      amoParams.has('amo_user_id') ||
      amoParams.has('amo_subdomain');

    const ssoBase = (import.meta as any).env?.VITE_SSO_URL as string | undefined;
    if (typeof ssoBase === 'string' && ssoBase) {
      const base = ssoBase.endsWith('/') ? ssoBase.slice(0, -1) : ssoBase;
      const fullCurrent = window.location.origin + location.pathname + (location.search || '');

      // If amo SSO token exists, let the central auth callback consume it.
      const ssoToken = amoParams.get("sso");
      if (ssoToken) {
        const withoutSso = new URL(fullCurrent);
        withoutSso.searchParams.delete("sso");
        return (
          <Navigate
            to={`${base}/${currentLanguage}/auth/callback?sso=${encodeURIComponent(ssoToken)}&redirect_to=${encodeURIComponent(withoutSso.toString())}`}
            replace
          />
        );
      }

      const authPath = hasAmoInstall ? "auth/signup" : "auth";
      return (
        <Navigate
          to={`${base}/${currentLanguage}/${authPath}?redirect_to=${encodeURIComponent(fullCurrent)}`}
          replace
        />
      );
    }

    // No SSO configured: fall back to local auth pages in main app (legacy).
    const authPath = addLanguageToPath(hasAmoInstall ? "/auth/signup" : "/auth", currentLanguage);
    const redirectValue = location.pathname + (location.search || "");
    return <Navigate to={`${authPath}?redirect=${encodeURIComponent(redirectValue)}`} replace />;
  }

  if (requireAuth && user) {
    if (passwordGateLoading) return <FullPageLoaderView />;
    if (needsPasswordSet) {
      const setPasswordPath = addLanguageToPath('/set-password', currentLanguage);
      return <Navigate to={`${setPasswordPath}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
    }
  }

  return <>{children}</>;
}; 