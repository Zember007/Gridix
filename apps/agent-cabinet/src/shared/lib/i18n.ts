import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { addSharedResources, DEFAULT_LANGUAGE } from "@gridix/utils/lib";

// Load all locale JSON files from ./locales/<lang>/*.json
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  "../../locales/*/*.json",
  { eager: true },
);

function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = "",
): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(
        flattened,
        flattenTranslations(value as Record<string, unknown>, newKey),
      );
    } else {
      flattened[newKey] = String(value);
    }
  }

  return flattened;
}

const resources: Record<string, { translation: Record<string, string> }> = {};

Object.entries(localeModules).forEach(([path, mod]) => {
  const match = path.match(/\/locales\/(ru|en|ka|ar|he)\/(.+)\.json$/);
  if (!match) return;

  const lng = match[1];
  const fileBase = match[2];
  if (!lng || !fileBase) return;

  const data = (mod as { default: Record<string, unknown> }).default ?? {};
  const flat = flattenTranslations(data, fileBase);

  if (!resources[lng]) resources[lng] = { translation: {} };
  Object.assign(resources[lng].translation, flat);
});

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: ["en", "ru"],
  interpolation: { escapeValue: false },
  keySeparator: false,
  nsSeparator: false,
  debug: false,
  react: { useSuspense: false },
});

addSharedResources(i18n);

export default i18n;
