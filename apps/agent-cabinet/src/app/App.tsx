import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { LanguageWrapper } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import { AgentWorkspaceProvider } from "@/app/providers/AgentWorkspaceProvider";
import { AgentCabinetRouter, ProtectedRoute } from "@/app/routing";

import SetPasswordPage from "@/pages/SetPasswordPage";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <Routes>
            <Route
              path="/:lang"
              element={
                <ProtectedRoute>
                  <Outlet />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <AgentWorkspaceProvider>
                    <AgentCabinetRouter />
                  </AgentWorkspaceProvider>
                }
              />
              <Route
                path="application"
                element={<Navigate to="../?page=dashboard" replace />}
              />
              <Route path="set-password" element={<SetPasswordPage />} />
              <Route
                path="projects"
                element={<Navigate to="../?page=catalog" replace />}
              />
              <Route
                path="contacts"
                element={<Navigate to="../?page=contacts" replace />}
              />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}
