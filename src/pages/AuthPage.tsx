import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthForm } from '@/components/Auth/AuthForm';
import ResetPasswordForm from '@/components/Auth/ResetPasswordForm';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';
import { supabase } from '@/integrations/supabase/client';

const AuthPage = () => {
  const { navigate } = useLanguageNavigation();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  
  const redirectTo = searchParams.get('redirect') || '/admin';
  const mode = searchParams.get('mode');
  const [isRecovery, setIsRecovery] = useState<boolean>(false);

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
    if (user && !loading && !isRecovery) {
      // Если redirect содержит языковой префикс, используем его напрямую
      // Иначе добавляем языковой префикс
      if (redirectTo.match(/^\/(ru|en|ge)\//)) {
        window.location.href = redirectTo;
      } else {
        navigate('/admin');
      }
    }
  }, [user, loading, navigate, redirectTo, isRecovery]);

  if (loading) {
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
        onSuccess={() => {
          if (redirectTo.match(/^\/(ru|en|ge)\//)) {
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