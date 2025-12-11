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
  const [ssoProcessing, setSsoProcessing] = useState(false);

  // Обработка SSO-токена из query-параметра ?sso=
  // Используем Bring Your Own JWT подход: обмениваем custom JWT на полноценную сессию
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const ssoToken = searchParams.get('sso');

    if (!ssoToken || ssoHandled || user) {
      setSsoProcessing(false);
      return;
    }

    console.log('Processing SSO token from URL...');
    setSsoHandled(true);
    setSsoProcessing(true);

    (async () => {
      try {
        // Verify and decode the signed SSO token
        console.log('Verifying SSO token...');
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        
        if (!supabaseUrl) {
          console.error('Missing Supabase configuration');
          setSsoProcessing(false);
          return;
        }

        const { data: sessionData , error } = await supabase.functions.invoke('amocrm-sso-login', {
          body: {
            action: 'verify',
            token: ssoToken,
          }
        });

        if (error) {
          console.error('Failed to verify SSO token:', error);
          setSsoProcessing(false);
          return;
        }

        
        // Set session with the returned tokens
        const { error: setError } = await supabase.auth.setSession({
          access_token: sessionData.access_token,
          refresh_token: sessionData.refresh_token,
        });

        if (setError) {
          console.error('Error setting session:', setError);
          setSsoProcessing(false);
          return;
        }

        console.log('SSO session set successfully for user:', sessionData.user?.email);

        // Очищаем sso из URL, чтобы избежать повторной обработки и утечки токена в историю
        const newSearch = new URLSearchParams(location.search);
        newSearch.delete('sso');
        const newSearchString = newSearch.toString();
        const newUrl =
          location.pathname + (newSearchString ? `?${newSearchString}` : '') + location.hash;
        window.history.replaceState({}, '', newUrl);
        
        console.log('SSO token removed from URL');
        setSsoProcessing(false);
      } catch (e) {
        console.error('Failed to process SSO token:', e);
        // В случае ошибки тоже очищаем параметр
        const newSearch = new URLSearchParams(location.search);
        newSearch.delete('sso');
        const newSearchString = newSearch.toString();
        const newUrl =
          location.pathname + (newSearchString ? `?${newSearchString}` : '') + location.hash;
        window.history.replaceState({}, '', newUrl);
        setSsoProcessing(false);
      }
    })();
  }, [location.pathname, location.search, location.hash, ssoHandled, user]);

  const searchParams = new URLSearchParams(location.search);
  const hasSso = searchParams.has('sso');

  // Показываем loading если:
  // 1. Идет загрузка auth состояния
  // 2. Есть SSO токен, но он еще обрабатывается
  // 3. Есть SSO токен, но пользователь еще не авторизован и обработка еще не завершена
  if (loading || ssoProcessing || (hasSso && !user && !ssoHandled)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Редиректим на /auth только если:
  // 1. Требуется авторизация
  // 2. Пользователь не авторизован
  // 3. НЕТ SSO токена в URL (или он уже обработан)
  // 4. Обработка SSO не идет
  if (requireAuth && !user && !hasSso && !ssoProcessing) {
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