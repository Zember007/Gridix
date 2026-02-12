import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
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

  return (
    <PartnersCabinetLayout activePage={activePage} onChangePage={setActivePage}>
      <div className="p-4 md:p-6">
        <PartnerProgram
          navigationMode="sidebar"
          activeSection={activePage}
          onSectionChange={setActivePage}
          autoCreateProfile
        />
      </div>
    </PartnersCabinetLayout>
  );
}

function LegacyRedirect() {
  const { lang } = useParams();
  return <Navigate to={`/${lang ?? "ru"}/`} replace />;
}

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <AuthProvider>
            <NoWorkspaceProvider>
              <Routes>
                <Route
                  path="/:lang/"
                  element={
                    <ProtectedRoute>
                      <PartnersCabinetRouter />
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
                <Route path="/:lang/auth" element={<LegacyRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NoWorkspaceProvider>
          </AuthProvider>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}
