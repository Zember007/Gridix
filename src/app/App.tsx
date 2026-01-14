import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import {
  AdminProviders,
  BaseProviders,
  EmbedProviders,
  LanguageProviders,
} from "@/app/providers";
import { AdminRoutes, DomainRoutes, EmbedRoutes, PublicRoutes } from "@/app/router";
import { UsertourBlockingGate } from "@/integrations/UsertourBlockingGate";

const NotFound = lazy(() => import("@/pages/NotFound"));
const SuperAdminPage = lazy(() => import("@/pages/SuperAdminPage"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
  </div>
);

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <AuthProvider>
          <UsertourBlockingGate>
            <Routes>
              <Route
                path="/embed/*"
                element={
                  <EmbedProviders>
                    <Suspense fallback={<PageLoader />}>
                      <EmbedRoutes />
                    </Suspense>
                  </EmbedProviders>
                }
              />

              <Route
                path="/:lang/superadmin"
                element={
                  <LanguageProviders>
                    <ProtectedRoute>
                      <Suspense fallback={<PageLoader />}>
                        <SuperAdminPage />
                      </Suspense>
                    </ProtectedRoute>
                  </LanguageProviders>
                }
              />

              <Route
                path="/:lang/admin/*"
                element={
                  <AdminProviders>
                    <Suspense fallback={<PageLoader />}>
                      <AdminRoutes />
                    </Suspense>
                  </AdminProviders>
                }
              />

              <Route
                path="/:lang/*"
                element={
                  <LanguageProviders>
                    <Suspense fallback={<PageLoader />}>
                      <PublicRoutes />
                    </Suspense>
                  </LanguageProviders>
                }
              />

              <Route
                path="/*"
                element={
                  <EmbedProviders>
                    <Suspense fallback={<PageLoader />}>
                      <DomainRoutes />
                    </Suspense>
                  </EmbedProviders>
                }
              />

              <Route
                path="*"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <NotFound />
                  </Suspense>
                }
              />
            </Routes>
          </UsertourBlockingGate>
        </AuthProvider>
      </BrowserRouter>
    </BaseProviders>
  );
}



















