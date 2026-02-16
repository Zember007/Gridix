import { useNavigate, useLocation } from "react-router-dom";

import { useLanguage } from "./LanguageContext";
import {
  addLanguageToPath,
  removeLanguageFromPath,
  getLanguageParam,
} from "../../lib";

/**
 * Hook for language-aware navigation
 * Automatically adds the current language prefix to navigation paths
 */
export const useLanguageNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();

  const navigateWithLanguage = (
    path: string,
    options?: { replace?: boolean },
  ) => {
    const pathWithLanguage = addLanguageToPath(path, language);
    navigate(pathWithLanguage, options);
  };

  const getCurrentPathWithoutLanguage = () => {
    return removeLanguageFromPath(location.pathname);
  };

  const getPathWithLanguage = (path: string) => {
    return addLanguageToPath(path, language);
  };

  const getCurrentLanguageParam = () => {
    return getLanguageParam(language);
  };

  return {
    navigate: navigateWithLanguage,
    getCurrentPathWithoutLanguage,
    getPathWithLanguage,
    getCurrentLanguageParam,
    currentPath: location.pathname,
    currentLanguage: language,
  };
};
