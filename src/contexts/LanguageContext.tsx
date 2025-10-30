
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Language,
  getLanguageFromPath,
  addLanguageToPath,
  removeLanguageFromPath,
  DEFAULT_LANGUAGE,
  LANGUAGE_CONFIG
} from '@/lib/language-utils';


// Register all JSON translation files under src/locales/{lang}/*.json (lazy)
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  '@/locales/*/*.json'
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

// Cache for loaded, flattened translations per language (process-wide)
const languageCache: Record<Language, Record<string, string>> = {
  ru: {},
  en: {},
  ka: {},
  ar: {},
};

const loadedLanguages = new Set<Language>();

async function loadLanguageIntoCache(lang: Language) {
  if (loadedLanguages.has(lang)) return;
  const entries = Object.entries(localeModules).filter(([path]) =>
    path.includes(`/locales/${lang}/`)
  );
  const modules = await Promise.all(entries.map(([, loader]) => loader()));
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const path = entry[0];
    const mod = modules[i];
    if (!mod) continue;
    const m = path.match(/\/locales\/(ru|en|ka|ar)\/(.+)\.json$/);
    const fileBase = m ? m[2] : '';
    const data = mod.default ?? {};
    if (data && typeof data === 'object') {
      const flat = flattenTranslations(data as Record<string, unknown>, fileBase);
      Object.assign(languageCache[lang], flat);
    }
  }
  loadedLanguages.add(lang);
}

function buildTranslationsFromCache(): Translations {
  const result: Translations = {};
  const langs = Array.from(loadedLanguages) as Language[];
  const allKeys = new Set<string>();
  langs.forEach(l => {
    Object.keys(languageCache[l]).forEach(k => allKeys.add(k));
  });
  allKeys.forEach(key => {
    const entry: Partial<Record<Language, string>> = {};
    langs.forEach(l => {
      const v = languageCache[l][key];
      if (v !== undefined) entry[l] = v;
    });
    result[key] = entry;
  });
  return result;
}



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
  // Optional explicit language for embed/widget contexts
  initialLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize language from URL path or default
  const [language, setLanguageState] = useState<Language>(() => {
    return getLanguageFromPath(location.pathname);
  });

  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      await loadLanguageIntoCache(language);
      if (language !== 'en') {
        // Background load for fallback
        loadLanguageIntoCache('en').then(() => {
          if (!isCancelled) setTranslations(buildTranslationsFromCache());
        });
      }
      if (!isCancelled) setTranslations(buildTranslationsFromCache());
    })();
    return () => { isCancelled = true; };
  }, [language]);

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
export const EmbedLanguageProvider: React.FC<LanguageProviderProps> = ({ children, initialLanguage }) => {
  // Initialize language from URL query parameter, localStorage or default
  const [language, setLanguageState] = useState<Language>(() => {
    // Highest priority: explicit initialLanguage prop (e.g. from widget options)
    if (initialLanguage && (initialLanguage as Language) in LANGUAGE_CONFIG) {
      return initialLanguage as Language;
    }
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

  // Keep state in sync if an explicit initialLanguage prop is provided/changes
  useEffect(() => {
    if (initialLanguage && initialLanguage !== language) {
      setLanguageState(initialLanguage);
      localStorage.setItem('embed-language', initialLanguage);
    }
  }, [initialLanguage, language]);

  const [translations, setTranslations] = useState<Translations>({});

  useEffect(() => {
    let isCancelled = false;
    (async () => {
      await loadLanguageIntoCache(language);
      if (language !== 'en') {
        loadLanguageIntoCache('en').then(() => {
          if (!isCancelled) setTranslations(buildTranslationsFromCache());
        });
      }
      if (!isCancelled) setTranslations(buildTranslationsFromCache());
    })();
    return () => { isCancelled = true; };
  }, [language]);

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
