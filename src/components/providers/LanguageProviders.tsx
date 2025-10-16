import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import LanguageWrapper from "@/components/LanguageWrapper";

interface LanguageProvidersProps {
  children: ReactNode;
}

export function LanguageProviders({ children }: LanguageProvidersProps) {
  return (
    <LanguageProvider>
      <LanguageWrapper>
        {children}
      </LanguageWrapper>
    </LanguageProvider>
  );
}
