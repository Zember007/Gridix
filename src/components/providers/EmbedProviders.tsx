import { ReactNode } from "react";

interface EmbedProvidersProps {
  children: ReactNode;
}

export function EmbedProviders({ children }: EmbedProvidersProps) {
  return <>{children}</>;
}
