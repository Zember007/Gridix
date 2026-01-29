import { ReactNode } from "react";
import { LanguageWrapper } from "@gridix/utils/react";

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
