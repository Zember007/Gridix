import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE } from "@gridix/utils/lib";

// Импорт всех JSON файлов переводов
// Используем относительный путь от текущего файла (src/shared/lib/i18n.ts -> src/locales)
const localeModules = import.meta.glob<{ default: Record<string, unknown> }>(
  '../../locales/*/*.json',
  { eager: true }
);

// Отладочная информация
// Функция для преобразования вложенных объектов в плоскую структуру с точечными ключами
function flattenTranslations(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const flattened: Record<string, string> = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flattened, flattenTranslations(value as Record<string, unknown>, newKey));
      } else {
        flattened[newKey] = String(value);
      }
    }
  }

  return flattened;
}

// Собираем все переводы в формат resources для i18next
const resources: Record<string, { translation: Record<string, string> }> = {};

Object.entries(localeModules).forEach(([path, mod]) => {
  // Извлекаем язык и имя файла из пути: /locales/ru/common.json -> ru, common
  const match = path.match(/\/locales\/(ru|en|ka|ar|he)\/(.+)\.json$/);
  if (!match) {
    console.warn('[i18n] Не удалось распарсить путь:', path);
    return;
  }

  const lng = match[1];
  const fileBase = match[2];
  
  if (!lng || !fileBase) {
    console.warn('[i18n] Неверный формат пути:', path);
    return;
  }

  const data = (mod as { default: Record<string, unknown> }).default ?? {};

  // Преобразуем JSON в плоскую структуру с префиксом из имени файла
  const flat = flattenTranslations(data, fileBase);

  // Инициализируем язык, если его еще нет
  if (!resources[lng]) {
    resources[lng] = { translation: {} };
  }

  // Добавляем переводы в общий namespace translation
  Object.assign(resources[lng].translation, flat);
});

// Отладочная информация о загруженных ресурсах
console.log('[i18n] Загружено языков:', Object.keys(resources));
console.log('[i18n] Количество ключей по языкам:', 
  Object.entries(resources).map(([lang, res]) => `${lang}: ${Object.keys(res.translation).length}`).join(', ')
);

// Инициализация i18next
void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: ['en', 'ru'],
    
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
