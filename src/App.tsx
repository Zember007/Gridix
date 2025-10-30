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
          <Routes>
            {/* Default route - check for custom domain or redirect to default language */}
            <Route path="/" element={<EmbedProviders><Suspense fallback={<PageLoader />}><DomainProjectPage /></Suspense></EmbedProviders>} />

            {/* Custom domain apartment route */}
            <Route path="/apartment/:apartmentId" element={<EmbedProviders><Suspense fallback={<PageLoader />}><DomainApartmentPage /></Suspense></EmbedProviders>} />

            {/* Language-specific routes with :lang parameter */}
            <Route path="/:lang" element={<LanguageProviders><Suspense fallback={<PageLoader />}><Index /></Suspense></LanguageProviders>} />
            <Route path="/:lang/widget/:projectSlug" element={<LanguageProviders><Suspense fallback={<PageLoader />}><ProjectWidgetPage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/project/:projectSlug" element={<LanguageProviders><Suspense fallback={<PageLoader />}><ProjectWidgetPage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/project/:projectSlug/apartment/:apartmentNumber" element={<LanguageProviders><Suspense fallback={<PageLoader />}><ApartmentDetailsPage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/project/:projectSlug/apartment/:apartmentNumber/pdf" element={<LanguageProviders><Suspense fallback={<PageLoader />}><PDFTemplatePage /></Suspense></LanguageProviders>} />

            {/* Backward compatibility routes - redirect old ID-based URLs to new slug-based ones */}
            <Route path="/:lang/widget/id/:projectId" element={<LanguageProviders><Suspense fallback={<PageLoader />}><ProjectWidgetPage useId /></Suspense></LanguageProviders>} />
            <Route path="/:lang/project/id/:projectId" element={<LanguageProviders><Suspense fallback={<PageLoader />}><ProjectWidgetPage useId /></Suspense></LanguageProviders>} />
            <Route path="/:lang/project/id/:projectId/apartment/id/:apartmentId" element={<LanguageProviders><Suspense fallback={<PageLoader />}><ApartmentDetailsPage useId /></Suspense></LanguageProviders>} />
            <Route path="/:lang/project/id/:projectId/apartment/id/:apartmentId/pdf" element={<LanguageProviders><Suspense fallback={<PageLoader />}><PDFTemplatePage useId /></Suspense></LanguageProviders>} />

            {/* Legal pages */}
            <Route path="/:lang/privacy-policy" element={<LanguageProviders><Suspense fallback={<PageLoader />}><PrivacyPolicyPage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/terms-of-service" element={<LanguageProviders><Suspense fallback={<PageLoader />}><TermsOfServicePage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/refund-policy" element={<LanguageProviders><Suspense fallback={<PageLoader />}><RefundPolicyPage /></Suspense></LanguageProviders>} />

            {/* Contacts Page */}
            <Route path="/:lang/contacts" element={<LanguageProviders><Suspense fallback={<PageLoader />}><ContactsPage /></Suspense></LanguageProviders>} />
            <Route path="/contacts" element={<Navigate to={`/${DEFAULT_LANGUAGE}/contacts`} replace />} />

            {/* Public Pricing Page */}
            <Route path="/:lang/pricing" element={<LanguageProviders><Suspense fallback={<PageLoader />}><PricingPage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/price" element={<LanguageProviders><Suspense fallback={<PageLoader />}><PricingPage /></Suspense></LanguageProviders>} />
            {/* Redirect bare pricing routes to default language */}
            <Route path="/pricing" element={<Navigate to={`/${DEFAULT_LANGUAGE}/pricing`} replace />} />
            <Route path="/price" element={<Navigate to={`/${DEFAULT_LANGUAGE}/pricing`} replace />} />

            {/* Auth routes */}
            <Route path="/:lang/auth" element={<LanguageProviders><Suspense fallback={<PageLoader />}><AuthPage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/auth/signin" element={<LanguageProviders><Suspense fallback={<PageLoader />}><AuthPage /></Suspense></LanguageProviders>} />
            <Route path="/:lang/auth/signup" element={<LanguageProviders><Suspense fallback={<PageLoader />}><AuthPage /></Suspense></LanguageProviders>} />



            <Route path="/:lang/set-password" element={<LanguageProviders><Suspense fallback={<PageLoader />}><SetPasswordPage /></Suspense></LanguageProviders>} />

            {/* Invitation handler route - processes partner invitations */}
            <Route path="/:lang/invitation" element={<LanguageProviders><Suspense fallback={<PageLoader />}><InvitationHandlerPage /></Suspense></LanguageProviders>} />

            {/* Protected admin routes */}
            <Route path="/:lang/admin" element={
              <AdminProviders>
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <AdminPage />
                  </Suspense>
                </ProtectedRoute>
              </AdminProviders>
            } />

            <Route path="/:lang/partners" element={
              <AdminProviders>
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <PartnersPage />
                  </Suspense>
                </ProtectedRoute>
              </AdminProviders>
            } />

            <Route path="/:lang/admin/project/:projectSlug" element={
              <AdminProviders>
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ProjectEditorPage />
                  </Suspense>
                </ProtectedRoute>
              </AdminProviders>
            } />
            {/* Backward compatibility for admin */}
            <Route path="/:lang/admin/project/id/:projectId" element={
              <AdminProviders>
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <ProjectEditorPage useId />
                  </Suspense>
                </ProtectedRoute>
              </AdminProviders>
            } />

            <Route path="/:lang/superadmin" element={
              <LanguageProviders>
                <ProtectedRoute>
                  <Suspense fallback={<PageLoader />}>
                    <SuperAdminPage />
                  </Suspense>
                </ProtectedRoute>
              </LanguageProviders>
            } />


            {/* Embed routes without language prefix but with EmbedLanguageProvider */}
            <Route path="/embed/projects/:userId" element={<EmbedProviders><Suspense fallback={<PageLoader />}><EmbedProjectsPage /></Suspense></EmbedProviders>} />
            <Route path="/embed/project/:projectSlug" element={<EmbedProviders><Suspense fallback={<PageLoader />}><ProjectWidgetPage /></Suspense></EmbedProviders>} />
            {/* Backward compatibility for embed */}
            <Route path="/embed/project/id/:projectId" element={<EmbedProviders><Suspense fallback={<PageLoader />}><ProjectWidgetPage useId /></Suspense></EmbedProviders>} />

            {/* Widget preview routes */}
            <Route path="/widget/preview" element={<EmbedProviders><Suspense fallback={<PageLoader />}><WidgetPreviewPage /></Suspense></EmbedProviders>} />

            {/* Catch-all route */}
            <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </BaseProviders>
  );
}

export default App;
