import type { ReactNode } from "react"

import type { Language } from "../../lib"
import { useEmbedLanguage } from "./LanguageContext"

interface EmbedLanguageInitializerProps {
  children: ReactNode
  initialLanguage?: Language | undefined
}

/**
 * Компонент для инициализации языка в embed-режиме
 * Использует хук useEmbedLanguage для управления языком
 */
export function EmbedLanguageInitializer({ children, initialLanguage }: EmbedLanguageInitializerProps) {
  useEmbedLanguage(initialLanguage)
  return <>{children}</>
}

