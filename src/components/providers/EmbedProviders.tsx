import { ReactNode } from "react";
import { EmbedLanguageProvider } from "@/contexts/LanguageContext";

interface EmbedProvidersProps {
  children: ReactNode;
}

export function EmbedProviders({ children }: EmbedProvidersProps) {
  return (
    <EmbedLanguageProvider>
      {children}
    </EmbedLanguageProvider>
  );
}
