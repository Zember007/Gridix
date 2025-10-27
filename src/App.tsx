
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { BaseProviders, LanguageProviders, EmbedProviders, AdminProviders } from "@/components/providers";
import Index from "./pages/Index";
import ProjectWidgetPage from "./pages/ProjectWidgetPage";
import AdminPage from "./pages/AdminPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import EmbedProjectsPage from "./pages/EmbedProjectsPage";
import AuthPage from "./pages/AuthPage";
import SetPasswordPage from "./pages/SetPasswordPage";
import ApartmentDetailsPage from "./pages/ApartmentDetailsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import DomainProjectPage from "./pages/DomainProjectPage";
import DomainApartmentPage from "./pages/DomainApartmentPage";
import WidgetPreviewPage from "./pages/WidgetPreviewPage";
import PricingPage from "./pages/PricingPage";
import ContactsPage from "./pages/ContactsPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import InvitationHandlerPage from "./pages/InvitationHandlerPage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <AuthProvider>
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
              
              {/* Backward compatibility routes - redirect old ID-based URLs to new slug-based ones */}
              <Route path="/:lang/widget/id/:projectId" element={<LanguageProviders><ProjectWidgetPage useId /></LanguageProviders>} />
              <Route path="/:lang/project/id/:projectId" element={<LanguageProviders><ProjectWidgetPage useId /></LanguageProviders>} />
              <Route path="/:lang/project/id/:projectId/apartment/id/:apartmentId" element={<LanguageProviders><ApartmentDetailsPage useId /></LanguageProviders>} />
              
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
 
                     
              {/* Set password route - for users who need to set password */}
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
          </AuthProvider>
        </BrowserRouter>
    </BaseProviders>
  );
}

export default App;
