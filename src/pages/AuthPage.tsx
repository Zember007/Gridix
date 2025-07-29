import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthForm } from '@/components/Auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguageNavigation } from '@/hooks/useLanguageNavigation';

const AuthPage = () => {
  const { navigate } = useLanguageNavigation();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  
  const redirectTo = searchParams.get('redirect') || '/admin';

  useEffect(() => {
    if (user && !loading) {
      // Если redirect содержит языковой префикс, используем его напрямую
      // Иначе добавляем языковой префикс
      if (redirectTo.match(/^\/(ru|en|ge)\//)) {
        window.location.href = redirectTo;
      } else {
        navigate('/admin');
      }
    }
  }, [user, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return null; // Пользователь уже вошел, происходит перенаправление
  }

  return (
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
  );
};

export default AuthPage; 