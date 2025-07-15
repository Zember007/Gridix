import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { addLanguageToPath, removeLanguageFromPath } from '@/lib/language-utils';

/**
 * Hook for language-aware navigation
 * Automatically adds the current language prefix to navigation paths
 */
export const useLanguageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  /**
   * Navigate to a path with the current language prefix
   */
  const navigateWithLanguage = (path: string, options?: { replace?: boolean }) => {
    const pathWithLanguage = addLanguageToPath(path, language);
    navigate(pathWithLanguage, options);
  };

  /**
   * Get current path without language prefix
   */
  const getCurrentPathWithoutLanguage = () => {
    return removeLanguageFromPath(location.pathname);
  };

  /**
   * Get a path with the current language prefix
   */
  const getPathWithLanguage = (path: string) => {
    return addLanguageToPath(path, language);
  };

  return {
    navigate: navigateWithLanguage,
    getCurrentPathWithoutLanguage,
    getPathWithLanguage,
    currentPath: location.pathname,
    currentLanguage: language
  };
};
