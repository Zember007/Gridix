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
  type PartnersCabinetPage,
  usePartnersCabinetPageRouting,
} from "@/components/layout/PartnersCabinetLayout";
import { PartnerProgram } from "@gridix/partner-program";
import { ChangelogPage } from "@gridix/ui";

import SetPasswordPage from "@/pages/SetPasswordPage";
import NotFound from "@/pages/NotFound";

function PartnersCabinetRouter() {
  const { activePage, setActivePage } = usePartnersCabinetPageRouting();
  const isChangelog = activePage === "changelog";

  return (
    <PartnersCabinetLayout activePage={activePage} onChangePage={setActivePage}>
      {isChangelog ? (
        <ChangelogPage />
      ) : (
        <div className="p-4 md:p-6">
          <PartnerProgram
            navigationMode="sidebar"
            activeSection={
              activePage as Exclude<PartnersCabinetPage, "changelog">
            }
            onSectionChange={(section) => setActivePage(section)}
            autoCreateProfile
          />
        </div>
      )}
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
