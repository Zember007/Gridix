import { ReactNode } from "react";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import LanguageWrapper from "@/components/LanguageWrapper";

interface AdminProvidersProps {
  children: ReactNode;
}

export function AdminProviders({ children }: AdminProvidersProps) {
  return (
    <LanguageProvider>
      <WorkspaceProvider>
        <LanguageWrapper>
          {children}
        </LanguageWrapper>
      </WorkspaceProvider>
    </LanguageProvider>
  );
}
