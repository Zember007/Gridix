export type Language = 'ru' | 'en' | 'ka';

export const LANGUAGE_CONFIG = {
  ru: {
    code: 'ru',
    urlPrefix: '/ru',
    name: 'Русский',
    flag: '🇷🇺'
  },
  en: {
    code: 'en',
    urlPrefix: '/en',
    name: 'English',
    flag: '🇺🇸'
  },
  ka: {
    code: 'ka',
    urlPrefix: '/ge', // Using /ge/ for Georgian as requested
    name: 'ქართული',
    flag: '🇬🇪'
  }
} as const;

export const DEFAULT_LANGUAGE: Language = 'ru';

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];

/**
 * Extract language from URL path
 */
export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  // Check if first segment matches any language prefix
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIG)) {
    if (config.urlPrefix === `/${firstSegment}`) {
      return lang as Language;
    }
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Remove language prefix from path
 */
export function removeLanguageFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  // Check if first segment is a language prefix
  for (const config of Object.values(LANGUAGE_CONFIG)) {
    if (config.urlPrefix === `/${firstSegment}`) {
      // Remove the language segment and return the rest
      const remainingPath = segments.slice(1).join('/');
      return remainingPath ? `/${remainingPath}` : '/';
    }
  }
  
  return pathname;
}

/**
 * Add language prefix to path
 */
export function addLanguageToPath(pathname: string, language: Language): string {
  const cleanPath = removeLanguageFromPath(pathname);
  const prefix = LANGUAGE_CONFIG[language].urlPrefix;
  
  if (cleanPath === '/') {
    return prefix;
  }
  
  return `${prefix}${cleanPath}`;
}

/**
 * Get URL prefix for language
 */
export function getLanguagePrefix(language: Language): string {
  return LANGUAGE_CONFIG[language].urlPrefix;
}

/**
 * Check if path has language prefix
 */
export function hasLanguagePrefix(pathname: string): boolean {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  return Object.values(LANGUAGE_CONFIG).some(
    config => config.urlPrefix === `/${firstSegment}`
  );
}
