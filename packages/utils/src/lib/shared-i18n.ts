import type i18n from "i18next";

type SharedLanguage = "ar" | "en" | "he" | "ka" | "ru" | "tr";

type SharedLocaleModule = {
  default: Record<string, unknown>;
};

const SHARED_LOCALE_LOADERS: Record<
  SharedLanguage,
  () => Promise<SharedLocaleModule>
> = {
  ar: () => import("../locales/shared/ar.json"),
  en: () => import("../locales/shared/en.json"),
  he: () => import("../locales/shared/he.json"),
  ka: () => import("../locales/shared/ka.json"),
  ru: () => import("../locales/shared/ru.json"),
  tr: () => import("../locales/shared/tr.json"),
};

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

const SHARED_RESOURCES_CACHE: Record<string, Record<string, string>> = {};
const loadedSharedLanguages = new Set<string>();

async function ensureSharedResourcesLoaded(
  language: SharedLanguage,
): Promise<Record<string, string>> {
  if (loadedSharedLanguages.has(language)) {
    return SHARED_RESOURCES_CACHE[language] ?? {};
  }

  const load = SHARED_LOCALE_LOADERS[language];
  if (!load) {
    return {};
  }

  const mod = await load();
  const flattened = flattenTranslations(mod.default ?? {}, "");

  SHARED_RESOURCES_CACHE[language] = flattened;
  loadedSharedLanguages.add(language);

  return flattened;
}

/**
 * Lazily loads and merges shared package translations
 * (drawer, embed, common, admin, auth) for a single language.
 */
export async function addSharedResourcesForLanguage(
  i18nInstance: typeof i18n,
  language: string,
): Promise<void> {
  const normalized = language as SharedLanguage;
  if (!(normalized in SHARED_LOCALE_LOADERS)) return;

  const translations = await ensureSharedResourcesLoaded(normalized);

  i18nInstance.addResourceBundle(
    normalized,
    "translation",
    translations,
    true,
    false,
  );
}

/**
 * Backward‑compatible helper that eagerly loads shared resources
 * for all supported languages. Prefer `addSharedResourcesForLanguage`
 * in new code.
 */
export function addSharedResources(i18nInstance: typeof i18n): void {
  void Promise.all(
    (Object.keys(SHARED_LOCALE_LOADERS) as SharedLanguage[]).map((lng) =>
      addSharedResourcesForLanguage(i18nInstance, lng),
    ),
  );
}
