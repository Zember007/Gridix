import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthForm } from '@/components/Auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  
  const redirectTo = searchParams.get('redirect') || '/admin';

  useEffect(() => {
    if (user && !loading) {
      navigate(redirectTo);
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
      onSuccess={() => navigate(redirectTo)}
    />
  );
};

export default AuthPage; 