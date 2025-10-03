import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { addLanguageToPath, getLanguageFromPath } from '@/lib/language-utils';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user, loading, requiresPasswordSetup } = useAuth();
  const location = useLocation();

  if (loading) {
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



  return <>{children}</>;
}; 