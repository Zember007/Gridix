import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";

import AuthPage from "@/pages/AuthPage";
import ApplicationPage from "@/pages/ApplicationPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ContactsPage from "@/pages/ContactsPage";
import NotFound from "@/pages/NotFound";

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
                    <AppShell>
                      <ProjectsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:lang/application"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ApplicationPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:lang/projects"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ProjectsPage />
                    </AppShell>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/:lang/contacts"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <ContactsPage />
                    </AppShell>
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

