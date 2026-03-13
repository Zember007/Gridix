import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/features/auth";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import {
  AdminProviders,
  BaseProviders,
  EmbedProviders,
  LanguageProviders,
} from "@/app/providers";
import {
  AdminRoutes,
  DomainRoutes,
  EmbedRoutes,
  PublicRoutes,
} from "@/app/router";
import { UsertourBlockingGate } from "@gridix/utils/integrations";

const NotFound = lazy(() => import("@/pages/NotFound"));

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
                    <ProtectedRoute requireAuth={false}>
                      <Suspense fallback={<FullPageLoaderView />}>
                        <EmbedRoutes />
                      </Suspense>
                    </ProtectedRoute>
                  </EmbedProviders>
                }
              />

              <Route
                path="/:lang/admin/*"
                element={
                  <AdminProviders>
                    <Suspense fallback={<FullPageLoaderView />}>
                      <AdminRoutes />
                    </Suspense>
                  </AdminProviders>
                }
              />

              <Route
                path="/:lang/*"
                element={
                  <LanguageProviders>
                    <Suspense fallback={<FullPageLoaderView />}>
                      <PublicRoutes />
                    </Suspense>
                  </LanguageProviders>
                }
              />

              <Route
                path="/*"
                element={
                  <EmbedProviders>
                    <Suspense fallback={<FullPageLoaderView />}>
                      <DomainRoutes />
                    </Suspense>
                  </EmbedProviders>
                }
              />

              <Route
                path="*"
                element={
                  <Suspense fallback={<FullPageLoaderView />}>
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
