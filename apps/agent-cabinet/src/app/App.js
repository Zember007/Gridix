import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgentWorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import {
  AgentCabinetLayout,
  useAgentCabinetPageRouting,
} from "@/components/layout/AgentCabinetLayout";
import AuthPage from "@/pages/AuthPage";
import SetPasswordPage from "@/pages/SetPasswordPage";
import NotFound from "@/pages/NotFound";
import { DashboardTab } from "@/pages/tabs/DashboardTab";
import { AnalyticsTab } from "@/pages/tabs/AnalyticsTab";
import { ContactsTab } from "@/pages/tabs/ContactsTab";
import { CatalogTab } from "@/pages/tabs/CatalogTab";
import { PartnerProgramTab } from "@/pages/tabs/PartnerProgramTab";
import { AgentSettingsTab } from "@/pages/tabs/AgentSettingsTab";
function AgentCabinetRouter() {
  const { activePage, setActivePage } = useAgentCabinetPageRouting();
  const content = (() => {
    switch (activePage) {
      case "dashboard":
        return _jsx(DashboardTab, {});
      case "analytics":
        return _jsx(AnalyticsTab, {});
      case "contacts":
        return _jsx(ContactsTab, {});
      case "catalog":
        return _jsx(CatalogTab, {});
      case "partnerProgram":
        return _jsx(PartnerProgramTab, {});
      case "settings":
        return _jsx(AgentSettingsTab, {});
    }
  })();
  return _jsx(AgentCabinetLayout, {
    activePage: activePage,
    onChangePage: setActivePage,
    children: content,
  });
}
function LegacyRedirect({ page }) {
  const { lang } = useParams();
  return _jsx(Navigate, {
    to: `/${lang ?? "ru"}/?page=${encodeURIComponent(page)}`,
    replace: true,
  });
}
export default function App() {
  return _jsx(BaseProviders, {
    children: _jsx(BrowserRouter, {
      children: _jsx(LanguageWrapper, {
        children: _jsx(AuthProvider, {
          children: _jsxs(Routes, {
            children: [
              _jsx(Route, { path: "/:lang/auth", element: _jsx(AuthPage, {}) }),
              _jsx(Route, {
                path: "/:lang/",
                element: _jsx(ProtectedRoute, {
                  children: _jsx(AgentWorkspaceProvider, {
                    children: _jsx(AgentCabinetRouter, {}),
                  }),
                }),
              }),
              _jsx(Route, {
                path: "/:lang/application",
                element: _jsx(ProtectedRoute, {
                  children: _jsx(LegacyRedirect, { page: "dashboard" }),
                }),
              }),
              _jsx(Route, {
                path: "/:lang/set-password",
                element: _jsx(ProtectedRoute, {
                  children: _jsx(SetPasswordPage, {}),
                }),
              }),
              _jsx(Route, {
                path: "/:lang/projects",
                element: _jsx(ProtectedRoute, {
                  children: _jsx(LegacyRedirect, { page: "catalog" }),
                }),
              }),
              _jsx(Route, {
                path: "/:lang/contacts",
                element: _jsx(ProtectedRoute, {
                  children: _jsx(LegacyRedirect, { page: "contacts" }),
                }),
              }),
              _jsx(Route, { path: "*", element: _jsx(NotFound, {}) }),
            ],
          }),
        }),
      }),
    }),
  });
}
