import { ReactNode } from "react";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";

interface EmbedProvidersProps {
  children: ReactNode;
}

export function EmbedProviders({ children }: EmbedProvidersProps) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
