import { ReactNode } from 'react';
import { useEmbedLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/language-utils';

interface EmbedLanguageInitializerProps {
  children: ReactNode;
  initialLanguage?: Language | undefined;
}

/**
 * Компонент для инициализации языка в embed-режиме
 * Использует хук useEmbedLanguage для управления языком
 */
export function EmbedLanguageInitializer({ children, initialLanguage }: EmbedLanguageInitializerProps) {
  useEmbedLanguage(initialLanguage);
  
  return <>{children}</>;
}
