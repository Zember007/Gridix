import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import type { ReactNode } from "react";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import {
  AgentCabinetLayout,
  type AgentCabinetPage,
  useAgentCabinetPageRouting,
} from "@/app/navigation";
import { AuthProvider } from "@/features/auth-session";
import { AgentWorkspaceProvider } from "@/features/agent-workspace";
import { ProtectedRoute } from "@/features/auth-gate";

import AuthPage from "@/pages/AuthPage";
import SetPasswordPage from "@/pages/SetPasswordPage";
import NotFound from "@/pages/NotFound";
import {
  AgentSettingsTab,
  AnalyticsTab,
  CatalogTab,
  ContactsTab,
  DashboardTab,
  PartnerProgramTab,
} from "@/pages/tabs";

function AgentCabinetRouter() {
  const { activePage, setActivePage } = useAgentCabinetPageRouting();
  const pageContent: Record<AgentCabinetPage, ReactNode> = {
    dashboard: <DashboardTab />,
    analytics: <AnalyticsTab />,
    contacts: <ContactsTab />,
    catalog: <CatalogTab />,
    partnerProgram: <PartnerProgramTab />,
    settings: <AgentSettingsTab />,
  };

  return (
    <AgentCabinetLayout activePage={activePage} onChangePage={setActivePage}>
      {pageContent[activePage]}
    </AgentCabinetLayout>
  );
}

function LegacyRedirect({ page }: { page: string }) {
  const { lang } = useParams();
  return (
    <Navigate
      to={`/${lang ?? "ru"}/?page=${encodeURIComponent(page)}`}
      replace
    />
  );
}

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <AuthProvider>
            <Routes>
              <Route path="/:lang/auth" element={<AuthPage />} />

              <Route
                path="/:lang/"
                element={
                  <ProtectedRoute>
                    <AgentWorkspaceProvider>
                      <AgentCabinetRouter />
                    </AgentWorkspaceProvider>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:lang/application"
                element={
                  <ProtectedRoute>
                    <LegacyRedirect page="dashboard" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:lang/set-password"
                element={
                  <ProtectedRoute>
                    <SetPasswordPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:lang/projects"
                element={
                  <ProtectedRoute>
                    <LegacyRedirect page="catalog" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:lang/contacts"
                element={
                  <ProtectedRoute>
                    <LegacyRedirect page="contacts" />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}
