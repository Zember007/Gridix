import { ReactNode } from "react";
import LanguageWrapper from "@/components/LanguageWrapper";

interface LanguageProvidersProps {
  children: ReactNode;
}

export function LanguageProviders({ children }: LanguageProvidersProps) {
  return (
    <LanguageWrapper>
      {children}
    </LanguageWrapper>
  );
}
