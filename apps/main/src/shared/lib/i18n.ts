import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { addSharedResources, DEFAULT_LANGUAGE } from "@gridix/utils/lib";

const SUPPORTED_LANGUAGES = ["ru", "en", "ka", "ar", "he", "tr"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const eagerLocaleModules = import.meta.glob<{
  default: Record<string, unknown>;
}>("../../locales/en/*.json", { eager: true });
const lazyLocaleModules = import.meta.glob<{
  default: Record<string, unknown>;
}>("../../locales/*/*.json");

// Отладочная информация
// Функция для преобразования вложенных объектов в плоскую структуру с точечными ключами
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
const loadedLanguages = new Set<string>();

function parseLocalePath(path: string): {
  language: SupportedLanguage;
  fileBase: string;
} | null {
  const match = path.match(/\/locales\/(ru|en|ka|ar|he|tr)\/(.+)\.json$/);
  if (!match || !match[1] || !match[2]) {
    return null;
  }

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
}

Object.entries(eagerLocaleModules).forEach(([path, mod]) => {
  addModuleToResources(path, mod as { default: Record<string, unknown> });
});

loadedLanguages.add("en");

async function ensureLanguageResources(language: string): Promise<void> {
  if (!SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) return;
  if (loadedLanguages.has(language)) return;

  const entries = Object.entries(lazyLocaleModules).filter(([path]) =>
    path.includes(`/locales/${language}/`),
  );

  if (!entries.length) {
    loadedLanguages.add(language);
    return;
  }

  const loaded = await Promise.all(entries.map(([, load]) => load()));
  for (let i = 0; i < entries.length; i += 1) {
    const [path] = entries[i] ?? [];
    const mod = loaded[i];
    if (!path || !mod) continue;
    addModuleToResources(path, mod);
  }

  loadedLanguages.add(language);
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

// Инициализация i18next
void i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: ["en"],

  interpolation: {
    escapeValue: false, // React уже экранирует
  },

  // Отключаем разделитель ключей, так как используем точки в именах ключей
  keySeparator: false,

  // Отключаем разделитель namespace, так как используем один namespace
  nsSeparator: false,

  debug: false,

  react: {
    useSuspense: false,
  },
});

addSharedResources(i18n);

const initialLanguage = detectInitialLanguage();
void ensureLanguageResources(initialLanguage).then(() => {
  if (i18n.language !== initialLanguage) {
    void i18n.changeLanguage(initialLanguage);
  }
});

i18n.on("languageChanged", (language) => {
  void ensureLanguageResources(language);
});

export default i18n;
