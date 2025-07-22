import React, { ReactNode } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import { isValidLanguageParam, DEFAULT_LANGUAGE, getLanguagePrefix } from '@/lib/language-utils';

interface LanguageWrapperProps {
  children: ReactNode;
}

const LanguageWrapper: React.FC<LanguageWrapperProps> = ({ children }) => {
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  // If language is invalid, redirect to default language
  if (!isValidLanguageParam(lang)) {
    const pathWithoutLang = location.pathname.split('/').slice(2).join('/');
    const redirectPath = `${getLanguagePrefix(DEFAULT_LANGUAGE)}${pathWithoutLang ? `/${pathWithoutLang}` : ''}${location.search}`;
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default LanguageWrapper; 