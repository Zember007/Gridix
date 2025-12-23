import { ReactNode } from "react";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import LanguageWrapper from "@/components/LanguageWrapper";

interface AdminProvidersProps {
  children: ReactNode;
}

export function AdminProviders({ children }: AdminProvidersProps) {
  return (
    <WorkspaceProvider>
      <LanguageWrapper>
        {children}
      </LanguageWrapper>
    </WorkspaceProvider>
  );
}
