
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Language,
  getLanguageFromUrlParam,
  getLanguageFromPath,
  addLanguageToPath,
  removeLanguageFromPath,
  getLanguageParam,
  DEFAULT_LANGUAGE,
  LANGUAGE_CONFIG
} from '@/lib/language-utils';


// Auto-load all JSON translation files under src/locales/{lang}/*.json
// This replaces manual imports of individual JSON files
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  '@/locales/*/*.json',
  { eager: true }
);

interface Translations {
  [key: string]: Partial<Record<Language, string>>;
}

// Helper function to flatten nested JSON objects
function flattenTranslations(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, flattenTranslations(value as Record<string, unknown>, newKey));
      } else {
        flattened[newKey] = value as string;
      }
    }
  }
  
  return flattened;
}




// Build a per-language flat map by loading and flattening every JSON file
const perLanguageFlat: Record<Language, Record<string, string>> = {
  ru: {},
  en: {},
  ka: {},
  ar: {},
};

Object.entries(localeModules).forEach(([path, mod]) => {
  const match = path.match(/\/locales\/(ru|en|ka|ar)\/(.+)\.json$/);
  if (!match) return;
  const lang = match[1] as Language;
  const fileBase = match[2];
  const data = mod.default;
  if (!data || typeof data !== 'object') return;
  const flat = flattenTranslations(data as Record<string, unknown>, fileBase);
  Object.assign(perLanguageFlat[lang], flat);
});

// Merge keys across all languages into the shape Translations expects
const jsonTranslations: Translations = {};
const allKeys = new Set<string>();
(['ru', 'en', 'ka', 'ar'] as Language[]).forEach(lang => {
  Object.keys(perLanguageFlat[lang]).forEach(key => allKeys.add(key));
});

allKeys.forEach(key => {
  jsonTranslations[key] = {
    ru: perLanguageFlat.ru[key],
    en: perLanguageFlat.en[key],
    ka: perLanguageFlat.ka[key],
    ar: perLanguageFlat.ar[key],
  };
});

const translations: Translations = jsonTranslations;



interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize language from URL path or default
  const [language, setLanguageState] = useState<Language>(() => {
    return getLanguageFromPath(location.pathname);
  });

  // Update language when URL changes
  useEffect(() => {
    const urlLanguage = getLanguageFromPath(location.pathname);
    if (urlLanguage !== language) {
      setLanguageState(urlLanguage);
    }
  }, [location.pathname, language]);

  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;

    // Get current path without language prefix
    const cleanPath = removeLanguageFromPath(location.pathname);

    // Create new path with new language prefix
    const newPath = addLanguageToPath(cleanPath, newLanguage);

    // Navigate to new URL
    navigate(newPath, { replace: true });
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const base = translations[key] || {};
    const translation = (base[language] ?? base.en ?? base.ru ?? key);

    if (params) {
      return Object.keys(params).reduce((text, param) => {
        return text.replace(new RegExp(`{${param}}`, 'g'), String(params[param]));
      }, translation);
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Embed Language Provider for standalone widgets (without URL routing)
export const EmbedLanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Initialize language from URL query parameter, localStorage or default
  const [language, setLanguageState] = useState<Language>(() => {
    // First, check for lang query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && (langParam as Language) in LANGUAGE_CONFIG) {
      return langParam as Language;
    }

    // Then check localStorage
    const savedLanguage = localStorage.getItem('embed-language');
    if (savedLanguage && (savedLanguage as Language) in LANGUAGE_CONFIG) {
      return savedLanguage as Language;
    }

    return DEFAULT_LANGUAGE;
  });

  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;

    setLanguageState(newLanguage);
    localStorage.setItem('embed-language', newLanguage);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const base = translations[key] || {};
    const translation = (base[language] ?? base.en ?? base.ru ?? key);

    if (params) {
      return Object.keys(params).reduce((text, param) => {
        return text.replace(new RegExp(`{${param}}`, 'g'), String(params[param]));
      }, translation);
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
