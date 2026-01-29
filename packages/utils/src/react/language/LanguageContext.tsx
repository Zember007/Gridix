import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"

import {
  type Language,
  getLanguageFromPath,
  addLanguageToPath,
  removeLanguageFromPath,
  LANGUAGE_CONFIG,
} from "../../lib"

/**
 * Хук для работы с языком и переводами через react-i18next
 * Синхронизирует язык с URL и предоставляет функции для переводов
 */
export const useLanguage = () => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const language = i18n.language as Language

  useEffect(() => {
    const urlLanguage = getLanguageFromPath(location.pathname)
    if (urlLanguage !== i18n.language) {
      void i18n.changeLanguage(urlLanguage)
    }
  }, [location.pathname, i18n])

  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return

    const cleanPath = removeLanguageFromPath(location.pathname)
    const newPath = addLanguageToPath(cleanPath, newLanguage)

    void i18n.changeLanguage(newLanguage)
    navigate(newPath, { replace: true })
  }

  return {
    language,
    setLanguage,
    t,
  }
}

/**
 * Хук для работы с языком в embed-режиме (без роутинга)
 * Использует localStorage и query параметры для определения языка
 */
export const useEmbedLanguage = (initialLanguage?: Language) => {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    let detectedLanguage = initialLanguage

    if (!detectedLanguage) {
      const urlParams = new URLSearchParams(window.location.search)
      const langParam = urlParams.get("lang")
      if (langParam && (langParam as Language) in LANGUAGE_CONFIG) {
        detectedLanguage = langParam as Language
      }
    }

    if (!detectedLanguage) {
      const savedLanguage = localStorage.getItem("embed-language")
      if (savedLanguage && (savedLanguage as Language) in LANGUAGE_CONFIG) {
        detectedLanguage = savedLanguage as Language
      }
    }

    if (detectedLanguage && detectedLanguage !== i18n.language) {
      void i18n.changeLanguage(detectedLanguage)
    }
  }, [initialLanguage, i18n])

  const language = i18n.language as Language

  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return

    void i18n.changeLanguage(newLanguage)
    localStorage.setItem("embed-language", newLanguage)
  }

  return {
    language,
    setLanguage,
    t,
  }
}

