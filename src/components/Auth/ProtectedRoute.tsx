import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addLanguageToPath, getLanguageFromPath } from '@/lib/language-utils';
import { supabase } from '@/integrations/supabase/client';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading, requiresPasswordSetup } = useAuth();
  const location = useLocation();
  const [ssoHandled, setSsoHandled] = useState(false);

  // Обработка SSO-токена из query-параметра ?sso=
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ssoParam = searchParams.get('sso');

    if (!ssoParam || ssoHandled || user) {
      return;
    }

    setSsoHandled(true);

    (async () => {
      try {
        const decoded = JSON.parse(atob(ssoParam));
        const { access_token, refresh_token } = decoded || {};

        if (!access_token || !refresh_token) {
          console.error('Invalid SSO payload: missing tokens');
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('Error setting SSO session:', error);
          return;
        }

        // Очищаем sso из URL, чтобы избежать повторной обработки и утечки токена в историю
        const newSearch = new URLSearchParams(location.search);
        newSearch.delete('sso');
        const newSearchString = newSearch.toString();
        const newUrl =
          location.pathname + (newSearchString ? `?${newSearchString}` : '') + location.hash;
        window.history.replaceState({}, '', newUrl);
      } catch (e) {
        console.error('Failed to process SSO token', e);
      }
    })();
  }, [location.pathname, location.search, location.hash, ssoHandled, user]);

  const searchParams = new URLSearchParams(location.search);
  const hasSso = searchParams.has('sso');

  if (loading || (hasSso && !user && !ssoHandled)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    // Получаем текущий язык из URL и создаем правильный путь для авторизации
    const currentLanguage = getLanguageFromPath(location.pathname);
    const authPath = addLanguageToPath('/auth', currentLanguage);
    return <Navigate to={`${authPath}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Проверяем, требуется ли установка пароля
  if (requireAuth && user && (requiresPasswordSetup || localStorage.getItem('password_set_required') === 'true')) {
    const currentLanguage = getLanguageFromPath(location.pathname);
    const setPasswordPath = addLanguageToPath('/set-password', currentLanguage);
    return <Navigate to={`${setPasswordPath}?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}; 