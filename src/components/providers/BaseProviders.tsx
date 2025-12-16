import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as GridixToaster } from "@/lib/toast";
import { I18nextProvider } from "node_modules/react-i18next";
import i18n from "@/lib/i18n";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Данные считаются свежими 5 минут
      staleTime: 5 * 60 * 1000,
      // Храним кеш дольше, чтобы быстро возвращаться к предыдущим экранам
      gcTime: 30 * 60 * 1000,
      // Не дергаем тяжёлые запросы на каждый фокус окна
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

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
