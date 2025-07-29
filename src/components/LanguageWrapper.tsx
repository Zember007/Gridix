import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getLanguageFromPath, DEFAULT_LANGUAGE, getLanguagePrefix, hasLanguagePrefix } from '@/lib/language-utils';

interface LanguageWrapperProps {
  children: ReactNode;
}

const LanguageWrapper: React.FC<LanguageWrapperProps> = ({ children }) => {
  const location = useLocation();

  // If path doesn't have language prefix, redirect to default language
  if (!hasLanguagePrefix(location.pathname)) {
    const redirectPath = `${getLanguagePrefix(DEFAULT_LANGUAGE)}${location.pathname}${location.search}`;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default LanguageWrapper; 