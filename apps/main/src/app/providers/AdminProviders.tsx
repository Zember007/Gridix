import { ReactNode } from "react";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { LanguageWrapper } from "@gridix/utils/react";
import { AdminAccessProvider } from "@/entities/admin-access";

interface AdminProvidersProps {
  children: ReactNode;
}

export function AdminProviders({ children }: AdminProvidersProps) {
  return (
    <WorkspaceProvider>
      <AdminAccessProvider>
        <LanguageWrapper>{children}</LanguageWrapper>
      </AdminAccessProvider>
    </WorkspaceProvider>
  );
}
