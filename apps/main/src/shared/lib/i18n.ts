import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  addSharedResourcesForLanguage,
  DEFAULT_LANGUAGE,
} from "@gridix/utils/lib";

const SUPPORTED_LANGUAGES = ["ru", "en", "ka", "ar", "he", "tr"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const lazyLocaleModules = import.meta.glob<{
  default: Record<string, unknown>;
}>("../../locales/*/*.json");

function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(
          flattened,
          flattenTranslations(value as Record<string, unknown>, newKey),
        );
      } else {
        flattened[newKey] = String(value);
      }
    }
  }

  return flattened;
}

const resources: Record<string, { translation: Record<string, string> }> = {};
const loadedModulesByLanguage = new Map<string, Set<string>>();

type I18nWithPreload = typeof i18n & {
  __gridixPreloadForLanguagePath?: (
    language: string,
    pathname: string,
  ) => Promise<void>;
};

const LOCALE_PATH_RE = /\/locales\/([a-z]{2})\/(.+)\.json$/;

function parseLocalePath(path: string): {
  language: SupportedLanguage;
  fileBase: string;
} | null {
  const match = path.match(LOCALE_PATH_RE);
  if (!match?.[1] || !match[2]) return null;
  if (!SUPPORTED_LANGUAGES.includes(match[1] as SupportedLanguage)) return null;

  return {
    language: match[1] as SupportedLanguage,
    fileBase: match[2],
  };
}

function addModuleToResources(
  path: string,
  mod: { default: Record<string, unknown> },
) {
  const parsed = parseLocalePath(path);
  if (!parsed) return;

  const { language, fileBase } = parsed;
  const flat = flattenTranslations(mod.default ?? {}, fileBase);

  if (!resources[language]) {
    resources[language] = { translation: {} };
  }

  Object.assign(resources[language].translation, flat);

  if (i18n.isInitialized) {
    i18n.addResourceBundle(language, "translation", flat, true, false);
  }
}

function getLoadedModulesSet(language: string): Set<string> {
  const existing = loadedModulesByLanguage.get(language);
  if (existing) return existing;
  const next = new Set<string>();
  loadedModulesByLanguage.set(language, next);
  return next;
}

async function ensureLanguageResources(language: string): Promise<void> {
  if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) return;

  const loadedModules = getLoadedModulesSet(language);

  const entries = Object.entries(lazyLocaleModules).filter(([path]) => {
    const parsed = parseLocalePath(path);
    return (
      parsed !== null &&
      parsed.language === language &&
      !loadedModules.has(parsed.fileBase)
    );
  });

  if (!entries.length) return;

  const loaded = await Promise.all(entries.map(([, load]) => load()));
  for (let i = 0; i < entries.length; i += 1) {
    const [path] = entries[i] ?? [];
    const mod = loaded[i];
    if (!path || !mod) continue;
    const parsed = parseLocalePath(path);
    if (!parsed) continue;
    if (loadedModules.has(parsed.fileBase)) continue;
    addModuleToResources(path, mod);
    loadedModules.add(parsed.fileBase);
  }
}

function detectInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE as SupportedLanguage;
  }

  const match = window.location.pathname.match(
    /^\/(ru|en|ka|ar|he|tr)(?:\/|$)/,
  );
  return (match?.[1] as SupportedLanguage | undefined) ?? "en";
}

export async function preloadI18nForPathname(_pathname: string): Promise<void> {
  const language = i18n.language || detectInitialLanguage();
  await Promise.all([
    addSharedResourcesForLanguage(i18n, language),
    ensureLanguageResources(language),
  ]);
}

async function preloadI18nForLanguagePath(
  language: string,
  _pathname: string,
): Promise<void> {
  await Promise.all([
    addSharedResourcesForLanguage(i18n, language),
    ensureLanguageResources(language),
  ]);
}

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: [DEFAULT_LANGUAGE],

  interpolation: {
    escapeValue: false,
  },

  keySeparator: false,
  nsSeparator: false,
  debug: false,

  react: {
    useSuspense: false,
  },
});

const initialLanguage = detectInitialLanguage();

export const i18nReady: Promise<void> = Promise.all([
  addSharedResourcesForLanguage(i18n, initialLanguage),
  ensureLanguageResources(initialLanguage),
]).then(() => {
  if (i18n.language !== initialLanguage) {
    void i18n.changeLanguage(initialLanguage);
  }
});

i18n.on("languageChanged", (language) => {
  void Promise.all([
    addSharedResourcesForLanguage(i18n, language),
    ensureLanguageResources(language),
  ]);
});

(i18n as I18nWithPreload).__gridixPreloadForLanguagePath =
  preloadI18nForLanguagePath;

export default i18n;
