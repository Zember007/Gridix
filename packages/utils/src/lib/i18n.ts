import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LANGUAGE } from "./language-utils";

// Импорт всех JSON файлов переводов
// Note: This requires Vite's import.meta.glob support
// If locales are not in this package, this will be an empty object
// Applications should initialize i18n with their own resources
let localeModules: Record<
  string,
  () => Promise<{ default: Record<string, unknown> }>
> = {};

// Try to import locales if they exist in the package
// This is a safe fallback if locales are managed by the application
try {
  // Only use glob if we're in a Vite environment and locales exist
  // Type assertion for Vite's import.meta.glob
  const meta = import.meta as {
    glob?: (
      pattern: string,
      options?: { eager?: boolean },
    ) => Record<string, unknown>;
  };
  if (typeof meta.glob !== "undefined") {
    // Check if locales directory might exist (this is a best-effort approach)
    // Applications should provide their own i18n initialization
    localeModules = {};
  }
} catch {
  // Silently fail if glob is not available
  localeModules = {};
}

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

// Собираем все переводы в формат resources для i18next
const resources: Record<string, { translation: Record<string, string> }> = {};

// Only process locale modules if they exist
if (Object.keys(localeModules).length > 0) {
  Object.entries(localeModules).forEach(([path, mod]) => {
    // Извлекаем язык и имя файла из пути: /locales/ru/common.json -> ru, common
    const match = path.match(/\/locales\/(ru|en|ka|ar|he|tr|kk)\/(.+)\.json$/);
    if (!match) return;

    const lng = match[1];
    const fileBase = match[2];

    if (!lng || !fileBase) return;

    // Handle both eager and lazy imports
    const data =
      typeof mod === "function"
        ? {} // Lazy imports need to be awaited, skip for now
        : ((mod as { default: Record<string, unknown> })?.default ?? {});

    // Преобразуем JSON в плоскую структуру с префиксом из имени файла
    const flat = flattenTranslations(data, fileBase);

    // Инициализируем язык, если его еще нет
    if (!resources[lng]) {
      resources[lng] = { translation: {} };
    }

    // Добавляем переводы в общий namespace translation
    Object.assign(resources[lng].translation, flat);
  });
}

// Инициализация i18next
void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: ["en", "ru"],

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

export default i18n;
