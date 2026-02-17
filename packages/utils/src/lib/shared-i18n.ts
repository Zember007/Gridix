import type i18n from "i18next";
import arShared from "../locales/shared/ar.json";
import enShared from "../locales/shared/en.json";
import heShared from "../locales/shared/he.json";
import kaShared from "../locales/shared/ka.json";
import ruShared from "../locales/shared/ru.json";
import trShared from "../locales/shared/tr.json";

const SHARED_LOCALES = {
  ar: arShared as Record<string, unknown>,
  en: enShared as Record<string, unknown>,
  he: heShared as Record<string, unknown>,
  ka: kaShared as Record<string, unknown>,
  ru: ruShared as Record<string, unknown>,
  tr: trShared as Record<string, unknown>,
} as const;

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

const SHARED_RESOURCES: Record<string, Record<string, string>> = {};

for (const [lng, data] of Object.entries(SHARED_LOCALES)) {
  SHARED_RESOURCES[lng] = flattenTranslations(data, "");
}

/**
 * Merges shared package translations (drawer, embed, common, admin, auth)
 * into the given i18n instance. Call this when initializing app i18n.
 */
export function addSharedResources(i18nInstance: typeof i18n): void {
  for (const [lng, translations] of Object.entries(SHARED_RESOURCES)) {
    i18nInstance.addResourceBundle(
      lng,
      "translation",
      translations,
      true,
      false,
    );
  }
}
