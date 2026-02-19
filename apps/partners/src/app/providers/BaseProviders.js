import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { TooltipProvider, Toaster } from "@gridix/ui";
import { Toaster as GridixToaster } from "@gridix/utils/lib";
import { createAppQueryClient } from "@gridix/utils/api";
import i18n from "@/shared/lib/i18n";
const queryClient = createAppQueryClient();
export function BaseProviders({ children }) {
  return _jsx(I18nextProvider, {
    i18n: i18n,
    children: _jsx(QueryClientProvider, {
      client: queryClient,
      children: _jsxs(TooltipProvider, {
        children: [_jsx(Toaster, {}), _jsx(GridixToaster, {}), children],
      }),
    }),
  });
}
