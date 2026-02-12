import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { TooltipProvider, Toaster } from "@gridix/ui";
import { Toaster as GridixToaster } from "@gridix/utils/lib";
import { createAppQueryClient } from "@gridix/utils/api";
import i18n from "@/shared/lib/i18n";

const queryClient = createAppQueryClient();

export function BaseProviders({ children }: { children: ReactNode }) {
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
