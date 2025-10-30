import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { BaseProviders, LanguageProviders, EmbedProviders, AdminProviders } from "@/components/providers";

// Lazy load all pages for optimal code splitting
const Index = lazy(() => import("./pages/Index"));
const ProjectWidgetPage = lazy(() => import("./pages/ProjectWidgetPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ProjectEditorPage = lazy(() => import("./pages/ProjectEditorPage"));
const EmbedProjectsPage = lazy(() => import("./pages/EmbedProjectsPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const SetPasswordPage = lazy(() => import("./pages/SetPasswordPage"));
const ApartmentDetailsPage = lazy(() => import("./pages/ApartmentDetailsPage"));
const PDFTemplatePage = lazy(() => import("./pages/PDFTemplatePage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const RefundPolicyPage = lazy(() => import("./pages/RefundPolicyPage"));
const DomainProjectPage = lazy(() => import("./pages/DomainProjectPage"));
const DomainApartmentPage = lazy(() => import("./pages/DomainApartmentPage"));
const WidgetPreviewPage = lazy(() => import("./pages/WidgetPreviewPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const ContactsPage = lazy(() => import("./pages/ContactsPage"));
const SuperAdminPage = lazy(() => import("./pages/SuperAdminPage"));
const InvitationHandlerPage = lazy(() => import("./pages/InvitationHandlerPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PartnersPage = lazy(() => import("./pages/PartnersPage"));

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Default route - check for custom domain or redirect to default language */}
              <Route path="/" element={<EmbedProviders><DomainProjectPage /></EmbedProviders>} />

            {/* Custom domain apartment route */}
            <Route path="/apartment/:apartmentId" element={<EmbedProviders><DomainApartmentPage /></EmbedProviders>} />

            {/* Language-specific routes with :lang parameter */}
            <Route path="/:lang" element={<LanguageProviders><Index /></LanguageProviders>} />
            <Route path="/:lang/widget/:projectSlug" element={<LanguageProviders><ProjectWidgetPage /></LanguageProviders>} />
            <Route path="/:lang/project/:projectSlug" element={<LanguageProviders><ProjectWidgetPage /></LanguageProviders>} />
            <Route path="/:lang/project/:projectSlug/apartment/:apartmentNumber" element={<LanguageProviders><ApartmentDetailsPage /></LanguageProviders>} />
            <Route path="/:lang/project/:projectSlug/apartment/:apartmentNumber/pdf" element={<LanguageProviders><PDFTemplatePage /></LanguageProviders>} />

            {/* Backward compatibility routes - redirect old ID-based URLs to new slug-based ones */}
            <Route path="/:lang/widget/id/:projectId" element={<LanguageProviders><ProjectWidgetPage useId /></LanguageProviders>} />
            <Route path="/:lang/project/id/:projectId" element={<LanguageProviders><ProjectWidgetPage useId /></LanguageProviders>} />
            <Route path="/:lang/project/id/:projectId/apartment/id/:apartmentId" element={<LanguageProviders><ApartmentDetailsPage useId /></LanguageProviders>} />
            <Route path="/:lang/project/id/:projectId/apartment/id/:apartmentId/pdf" element={<LanguageProviders><PDFTemplatePage useId /></LanguageProviders>} />

            {/* Legal pages */}
            <Route path="/:lang/privacy-policy" element={<LanguageProviders><PrivacyPolicyPage /></LanguageProviders>} />
            <Route path="/:lang/terms-of-service" element={<LanguageProviders><TermsOfServicePage /></LanguageProviders>} />
            <Route path="/:lang/refund-policy" element={<LanguageProviders><RefundPolicyPage /></LanguageProviders>} />

            {/* Contacts Page */}
            <Route path="/:lang/contacts" element={<LanguageProviders><ContactsPage /></LanguageProviders>} />
            <Route path="/contacts" element={<Navigate to={`/${DEFAULT_LANGUAGE}/contacts`} replace />} />

            {/* Public Pricing Page */}
            <Route path="/:lang/pricing" element={<LanguageProviders><PricingPage /></LanguageProviders>} />
            <Route path="/:lang/price" element={<LanguageProviders><PricingPage /></LanguageProviders>} />
            {/* Redirect bare pricing routes to default language */}
            <Route path="/pricing" element={<Navigate to={`/${DEFAULT_LANGUAGE}/pricing`} replace />} />
            <Route path="/price" element={<Navigate to={`/${DEFAULT_LANGUAGE}/pricing`} replace />} />

            {/* Auth routes */}
            <Route path="/:lang/auth" element={<LanguageProviders><AuthPage /></LanguageProviders>} />
            <Route path="/:lang/auth/signin" element={<LanguageProviders><AuthPage /></LanguageProviders>} />
            <Route path="/:lang/auth/signup" element={<LanguageProviders><AuthPage /></LanguageProviders>} />



            <Route path="/:lang/set-password" element={<LanguageProviders><SetPasswordPage /></LanguageProviders>} />

            {/* Invitation handler route - processes partner invitations */}
            <Route path="/:lang/invitation" element={<LanguageProviders><InvitationHandlerPage /></LanguageProviders>} />

            {/* Protected admin routes */}
            <Route path="/:lang/admin" element={
              <AdminProviders>
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              </AdminProviders>
            } />

            <Route path="/:lang/partners" element={
              <AdminProviders>
                <ProtectedRoute>
                  <PartnersPage />
                </ProtectedRoute>
              </AdminProviders>
            } />

            <Route path="/:lang/admin/project/:projectSlug" element={
              <AdminProviders>
                <ProtectedRoute>
                  <ProjectEditorPage />
                </ProtectedRoute>
              </AdminProviders>
            } />
            {/* Backward compatibility for admin */}
            <Route path="/:lang/admin/project/id/:projectId" element={
              <AdminProviders>
                <ProtectedRoute>
                  <ProjectEditorPage useId />
                </ProtectedRoute>
              </AdminProviders>
            } />

            <Route path="/:lang/superadmin" element={
              <LanguageProviders>
                <ProtectedRoute>
                  <SuperAdminPage />
                </ProtectedRoute>
              </LanguageProviders>
            } />


            {/* Embed routes without language prefix but with EmbedLanguageProvider */}
            <Route path="/embed/projects/:userId" element={<EmbedProviders><EmbedProjectsPage /></EmbedProviders>} />
            <Route path="/embed/project/:projectSlug" element={<EmbedProviders><ProjectWidgetPage /></EmbedProviders>} />
            {/* Backward compatibility for embed */}
            <Route path="/embed/project/id/:projectId" element={<EmbedProviders><ProjectWidgetPage useId /></EmbedProviders>} />

            {/* Widget preview routes */}
            <Route path="/widget/preview" element={<EmbedProviders><WidgetPreviewPage /></EmbedProviders>} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </BaseProviders>
  );
}

export default App;
