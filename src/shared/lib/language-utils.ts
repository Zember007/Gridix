export type Language = 'ru' | 'en' | 'ka' | 'ar';

export const LANGUAGE_CONFIG = {
 
  en: {
    code: 'en',
    urlPrefix: '/en',
    name: 'English',
    flag: '🇺🇸'
  },
  ka: {
    code: 'ka',
    urlPrefix: '/ka', 
    name: 'ქართული',
    flag: '🇬🇪'
  },
  ar: {
    code: 'ar',
    urlPrefix: '/ar',
    name: 'العربية',
    flag: '🇸🇦'
  },
  ru: {
    code: 'ru',
    urlPrefix: '/ru',
    name: 'Русский',
    flag: '🇷🇺'
  }
} as const;

export const DEFAULT_LANGUAGE: Language = 'en';

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CONFIG) as Language[];

/**
 * Get language from URL parameter (e.g., 'ru' from '/ru/projects')
 */
export function getLanguageFromUrlParam(langParam: string | undefined): Language {
  if (!langParam) return DEFAULT_LANGUAGE;
  
  // Find language by URL prefix
  for (const [lang, config] of Object.entries(LANGUAGE_CONFIG)) {
    if (config.urlPrefix === `/${langParam}`) {
      return lang as Language;
    }
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Extract language from URL path (legacy support)
 */
export function getLanguageFromPath(pathname: string): Language {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (!firstSegment) return DEFAULT_LANGUAGE;
  
  return getLanguageFromUrlParam(firstSegment);
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
 * Get language prefix without leading slash (for URL params)
 */
export function getLanguageParam(language: Language): string {
  return LANGUAGE_CONFIG[language].urlPrefix.slice(1); // Remove leading slash
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

/**
 * Validate if a URL parameter is a valid language
 */
export function isValidLanguageParam(langParam: string | undefined): langParam is Language {
  if (!langParam) return false;
  
  return Object.values(LANGUAGE_CONFIG).some(
    config => config.urlPrefix === `/${langParam}`
  );
}
