import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { BaseProviders, LanguageProviders, EmbedProviders, AdminProviders } from "@/components/providers";
import { PublicRoutes, AdminRoutes, EmbedRoutes, DomainRoutes } from "@/routes";

// Lazy load pages
const NotFound = lazy(() => import("./pages/NotFound"));
const PartnersPage = lazy(() => import("./pages/PartnersPage"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdminPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Роуты без языкового префикса для редиректов */}
            <Route path="/contacts" element={<Navigate to={`/${DEFAULT_LANGUAGE}/contacts`} replace />} />
            <Route path="/pricing" element={<Navigate to={`/${DEFAULT_LANGUAGE}/pricing`} replace />} />
            <Route path="/price" element={<Navigate to={`/${DEFAULT_LANGUAGE}/pricing`} replace />} />

       

            {/* Embed роуты */}
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

            {/* Partners page - отдельный защищенный роут */}
            <Route
              path="/:lang/partners"
              element={
                <AdminProviders>
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoader />}>
                      <PartnersPage />
                    </Suspense>
                  </ProtectedRoute>
                </AdminProviders>
              }
            />

            {/* Super admin page - отдельный защищенный роут */}
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

            {/* Админские роуты */}
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

            {/* Публичные роуты с языковым префиксом */}
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

            {/* Custom domain routes - для сайтов с кастомным доменом (обрабатываются последними) */}
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

            {/* Catch-all route */}
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </BaseProviders>
  );
}

export default App;
