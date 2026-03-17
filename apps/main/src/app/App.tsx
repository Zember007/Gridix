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
import { PublicRoutes } from "@/app/router/PublicRoutes";
import { UsertourBlockingGate } from "@gridix/utils/integrations";

const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminRoutes = lazy(() =>
  import("@/app/router/AdminRoutes").then((module) => ({
    default: module.AdminRoutes,
  })),
);
const EmbedRoutes = lazy(() =>
  import("@/app/router/EmbedRoutes").then((module) => ({
    default: module.EmbedRoutes,
  })),
);
const DomainRoutes = lazy(() =>
  import("@/app/router/DomainRoutes").then((module) => ({
    default: module.DomainRoutes,
  })),
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
                    <PublicRoutes />
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
