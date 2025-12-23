import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Language,
  getLanguageFromPath,
  addLanguageToPath,
  removeLanguageFromPath,
  LANGUAGE_CONFIG,
} from '@/shared/lib/language-utils';

/**
 * Хук для работы с языком и переводами через react-i18next
 * Синхронизирует язык с URL и предоставляет функции для переводов
 */
export const useLanguage = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const language = i18n.language as Language;

  // Синхронизация языка при изменении URL
  useEffect(() => {
    const urlLanguage = getLanguageFromPath(location.pathname);
    if (urlLanguage !== i18n.language) {
      void i18n.changeLanguage(urlLanguage);
    }
  }, [location.pathname, i18n]);

  // Функция для смены языка с навигацией
  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;

    // Получаем текущий путь без языкового префикса
    const cleanPath = removeLanguageFromPath(location.pathname);

    // Создаем новый путь с новым языковым префиксом
    const newPath = addLanguageToPath(cleanPath, newLanguage);

    // Меняем язык в i18next
    void i18n.changeLanguage(newLanguage);

    // Навигация на новый URL
    navigate(newPath, { replace: true });
  };

  return {
    language,
    setLanguage,
    t,
  };
};

/**
 * Хук для работы с языком в embed-режиме (без роутинга)
 * Использует localStorage и query параметры для определения языка
 */
export const useEmbedLanguage = (initialLanguage?: Language) => {
  const { t, i18n } = useTranslation();

  // Инициализация языка из разных источников
  useEffect(() => {
    let detectedLanguage = initialLanguage;

    // Проверяем query параметр
    if (!detectedLanguage) {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang');
      if (langParam && (langParam as Language) in LANGUAGE_CONFIG) {
        detectedLanguage = langParam as Language;
      }
    }

    // Проверяем localStorage
    if (!detectedLanguage) {
      const savedLanguage = localStorage.getItem('embed-language');
      if (savedLanguage && (savedLanguage as Language) in LANGUAGE_CONFIG) {
        detectedLanguage = savedLanguage as Language;
      }
    }

    if (detectedLanguage && detectedLanguage !== i18n.language) {
      void i18n.changeLanguage(detectedLanguage);
    }
  }, [initialLanguage, i18n]);

  const language = i18n.language as Language;

  // Функция для смены языка в embed-режиме
  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;

    void i18n.changeLanguage(newLanguage);
    localStorage.setItem('embed-language', newLanguage);
  };

  return {
    language,
    setLanguage,
    t,
  };
};
