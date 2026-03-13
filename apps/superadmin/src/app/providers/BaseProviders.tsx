import type { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider, Toaster } from "@gridix/ui";
import { Toaster as GridixToaster } from "@gridix/utils/lib";
import { getAdminThemeVariables } from "@gridix/utils";
import { I18nextProvider } from "react-i18next";
import { createAppQueryClient } from "@gridix/utils/api";
import i18n from "@/shared/lib/i18n";

const queryClient = createAppQueryClient();

const adminThemeStyle = getAdminThemeVariables() as Record<string, string>;

export function BaseProviders({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div style={adminThemeStyle} className="min-h-screen">
            <Toaster />
            <GridixToaster />
            {children}
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
