import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { AuthForm } from '@/components/Auth/AuthForm';
import ResetPasswordForm from '@/components/Auth/ResetPasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const { navigate } = useLanguageNavigation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  
  const redirectTo = searchParams.get('redirect') || '/admin';
  const mode = searchParams.get('mode');
  const [isRecovery, setIsRecovery] = useState<boolean>(false);
  
  // Определяем режим на основе URL
  const isSignup = location.pathname.includes('/signup');
  const isSignin = location.pathname.includes('/signin');

  const hashIndicatesRecovery = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const hash = window.location.hash || '';
    return /type=recovery/.test(hash);
  }, []);

  useEffect(() => {
    if (mode === 'recovery' || hashIndicatesRecovery) {
      setIsRecovery(true);
    }
  }, [mode, hashIndicatesRecovery]);

   // Сохраняем реферальный код и UTM-метки сразу при заходе на /auth/signup (до авторизации)
  // и логируем клик по ссылке (учитываются все переходы, даже без регистрации)
  useEffect(() => {
    const run = async () => {
      try {
        const path = window.location.pathname;
        const isSignupPath = path.endsWith('/auth/signup');
        if (!isSignupPath) return;

        const urlParams = new URLSearchParams(window.location.search);
        const partnerCode = urlParams.get('ref');
        const invitationCode = urlParams.get('invite');
        const invitationType = urlParams.get('type');
        const rawUtmSource = urlParams.get('utm_source');
        const utmMedium = urlParams.get('utm_medium');
        const utmCampaign = urlParams.get('utm_campaign');

        if (!partnerCode) return;

        const utmSource =
          rawUtmSource && rawUtmSource.trim().length > 0
            ? rawUtmSource.trim()
            : 'direct';

        const referralData = {
          partnerCode,
          invitationCode,
          invitationType,
          utmSource,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          timestamp: Date.now(),
        };

        localStorage.setItem('pending_referral', JSON.stringify(referralData));
        console.log('Referral data saved to localStorage:', referralData);

        // Логируем клик по ссылке в edge-функцию (без авторизации)
        try {
          await supabase.functions.invoke('partner-program', {
            body: {
              action: 'track_click',
              partner_code: partnerCode,
              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
            },
          });
        } catch (clickErr) {
          console.error('Error logging referral click:', clickErr);
        }
      } catch (error) {
        console.error('Error saving pending referral:', error);
      }
    };

    void run();
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !loading && !roleLoading && !isRecovery) {
      // Если redirect содержит языковой префикс, используем его напрямую
      // Иначе добавляем языковой префикс
      if (redirectTo.match(/^\/(ru|en|ka)\//)) {
        window.location.href = redirectTo;
      } else {
        // Все пользователи (и застройщики, и менеджеры) попадают в /admin
        // Там уже будет определяться контекст на основе роли
        navigate('/admin');
      }
    }
  }, [user, loading, roleLoading, navigate, redirectTo, isRecovery, userRole]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && !isRecovery) {
    return null; // Пользователь уже вошел, происходит перенаправление
  }

  return (
    isRecovery ? (
      <ResetPasswordForm onSuccess={() => {
        if (typeof window !== 'undefined') {
          window.location.hash = '';
        }
        navigate('/auth');
      }} />
    ) : (
      <AuthForm 
        redirectTo={redirectTo}
        defaultMode={isSignup ? 'signup' : isSignin ? 'signin' : undefined}
        onSuccess={() => {
          if (redirectTo.match(/^\/(ru|en|ka)\//)) {
            window.location.href = redirectTo;
          } else {
            navigate('/admin');
          }
        }}
      />
    )
  );
};

export default AuthPage; 