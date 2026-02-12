import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgentWorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { AgentCabinetLayout, useAgentCabinetPageRouting } from "@/components/layout/AgentCabinetLayout";

import AuthPage from "@/pages/AuthPage";
import SetPasswordPage from "@/pages/SetPasswordPage";
import NotFound from "@/pages/NotFound";
import { DashboardTab } from "@/pages/tabs/DashboardTab";
import { AnalyticsTab } from "@/pages/tabs/AnalyticsTab";
import { ContactsTab } from "@/pages/tabs/ContactsTab";
import { CatalogTab } from "@/pages/tabs/CatalogTab";
import { PartnerProgramTab } from "@/pages/tabs/PartnerProgramTab";

function AgentCabinetRouter() {
  const { activePage, setActivePage } = useAgentCabinetPageRouting();

  const content = (() => {
    switch (activePage) {
      case "dashboard":
        return <DashboardTab />;
      case "analytics":
        return <AnalyticsTab />;
      case "contacts":
        return <ContactsTab />;
      case "catalog":
        return <CatalogTab />;
      case "partnerProgram":
        return <PartnerProgramTab />;
    }
  })();

  return (
    <AgentCabinetLayout activePage={activePage} onChangePage={setActivePage}>
      {content}
    </AgentCabinetLayout>
  );
}

function LegacyRedirect({ page }: { page: string }) {
  const { lang } = useParams();
  return <Navigate to={`/${lang ?? "ru"}/?page=${encodeURIComponent(page)}`} replace />;
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

