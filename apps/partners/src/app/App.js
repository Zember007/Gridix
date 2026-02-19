import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { LanguageWrapper, NoWorkspaceProvider } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import {
  PartnersCabinetLayout,
  usePartnersCabinetPageRouting,
} from "@/components/layout/PartnersCabinetLayout";
import { PartnerProgram } from "@gridix/partner-program";
import SetPasswordPage from "@/pages/SetPasswordPage";
import NotFound from "@/pages/NotFound";
function PartnersCabinetRouter() {
  const { activePage, setActivePage } = usePartnersCabinetPageRouting();
  return _jsx(PartnersCabinetLayout, {
    activePage: activePage,
    onChangePage: setActivePage,
    children: _jsx("div", {
      className: "p-4 md:p-6",
      children: _jsx(PartnerProgram, {
        navigationMode: "sidebar",
        activeSection: activePage,
        onSectionChange: setActivePage,
        autoCreateProfile: true,
      }),
    }),
  });
}
function LegacyRedirect() {
  const { lang } = useParams();
  return _jsx(Navigate, { to: `/${lang ?? "ru"}/`, replace: true });
}
export default function App() {
  return _jsx(BaseProviders, {
    children: _jsx(BrowserRouter, {
      children: _jsx(LanguageWrapper, {
        children: _jsx(AuthProvider, {
          children: _jsx(NoWorkspaceProvider, {
            children: _jsxs(Routes, {
              children: [
                _jsx(Route, {
                  path: "/:lang/",
                  element: _jsx(ProtectedRoute, {
                    children: _jsx(PartnersCabinetRouter, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/:lang/set-password",
                  element: _jsx(ProtectedRoute, {
                    children: _jsx(SetPasswordPage, {}),
                  }),
                }),
                _jsx(Route, {
                  path: "/:lang/auth",
                  element: _jsx(LegacyRedirect, {}),
                }),
                _jsx(Route, { path: "*", element: _jsx(NotFound, {}) }),
              ],
            }),
          }),
        }),
      }),
    }),
  });
}
