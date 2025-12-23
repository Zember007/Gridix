import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/sonner";
import { Toaster as GridixToaster } from "@/shared/lib/toast";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/lib/i18n";
import { createAppQueryClient } from "@/shared/api/queryClient";

const queryClient = createAppQueryClient();

interface BaseProvidersProps {
  children: ReactNode;
}

export function BaseProviders({ children }: BaseProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <GridixToaster />
          {children}
        </TooltipProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
