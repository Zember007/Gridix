import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/features/auth";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import { preloadI18nForPathname } from "@/shared/lib/i18n";
import {
  AdminProviders,
  BaseProviders,
  EmbedProviders,
  LanguageProviders,
} from "@/app/providers";
import { GlobalScrollToTopButton } from "@/app/GlobalScrollToTopButton";
import { UsertourBlockingGate } from "@gridix/utils/integrations";

const NotFound = lazy(() => import("@/pages/NotFound"));
const PublicRoutes = lazy(() =>
  import("@/app/router/PublicRoutes").then((module) => ({
    default: module.PublicRoutes,
  })),
);
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

function I18nRoutePreloader() {
  const location = useLocation();
  useEffect(() => {
    void preloadI18nForPathname(location.pathname);
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <I18nRoutePreloader />
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
            <GlobalScrollToTopButton />
          </UsertourBlockingGate>
        </AuthProvider>
      </BrowserRouter>
    </BaseProviders>
  );
}
