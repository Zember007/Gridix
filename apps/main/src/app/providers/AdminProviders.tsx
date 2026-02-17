import { ReactNode } from "react";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { LanguageWrapper } from "@gridix/utils/react";

interface AdminProvidersProps {
  children: ReactNode;
}

export function AdminProviders({ children }: AdminProvidersProps) {
  return (
    <WorkspaceProvider>
      <LanguageWrapper>{children}</LanguageWrapper>
    </WorkspaceProvider>
  );
}
