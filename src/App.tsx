
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider, EmbedLanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { DEFAULT_LANGUAGE, getLanguagePrefix } from "@/lib/language-utils";
import LanguageWrapper from "@/components/LanguageWrapper";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import Index from "./pages/Index";
import ProjectsGalleryPage from "./pages/ProjectsGalleryPage";
import ProjectWidgetPage from "./pages/ProjectWidgetPage";
import AdminPage from "./pages/AdminPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import EmbedProjectsPage from "./pages/EmbedProjectsPage";
import EmbedProjectsMap from "./pages/EmbedProjectsMap";
import AuthPage from "./pages/AuthPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import ApartmentDetailsPage from "./pages/ApartmentDetailsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import DomainProjectPage from "./pages/DomainProjectPage";
import DomainApartmentPage from "./pages/DomainApartmentPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Default route - check for custom domain or redirect to default language */}
              <Route path="/" element={<EmbedLanguageProvider><DomainProjectPage /></EmbedLanguageProvider>} />
              
              {/* Custom domain apartment route */}
              <Route path="/apartment/:apartmentId" element={<EmbedLanguageProvider><DomainApartmentPage /></EmbedLanguageProvider>} />

              {/* Language-specific routes with :lang parameter */}
              <Route path="/:lang" element={<LanguageProvider><LanguageWrapper><Index /></LanguageWrapper></LanguageProvider>} />
              <Route path="/:lang/widget/:projectId" element={<LanguageProvider><LanguageWrapper><ProjectWidgetPage /></LanguageWrapper></LanguageProvider>} />
              <Route path="/:lang/project/:projectId" element={<LanguageProvider><LanguageWrapper><ProjectWidgetPage /></LanguageWrapper></LanguageProvider>} />
              <Route path="/:lang/project/:projectId/apartment/:apartmentId" element={<LanguageProvider><LanguageWrapper><ApartmentDetailsPage /></LanguageWrapper></LanguageProvider>} />
              
              {/* Legal pages */}
              <Route path="/:lang/privacy-policy" element={<LanguageProvider><LanguageWrapper><PrivacyPolicyPage /></LanguageWrapper></LanguageProvider>} />
              <Route path="/:lang/terms-of-service" element={<LanguageProvider><LanguageWrapper><TermsOfServicePage /></LanguageWrapper></LanguageProvider>} />
              
              {/* Auth routes */}
              <Route path="/:lang/auth" element={<LanguageProvider><LanguageWrapper><AuthPage /></LanguageWrapper></LanguageProvider>} />
              
              {/* Invitation acceptance route - no auth required */}
              <Route path="/accept-invitation" element={<EmbedLanguageProvider><AcceptInvitationPage /></EmbedLanguageProvider>} />
              
              {/* Protected admin routes */}
              <Route path="/:lang/admin" element={
                <LanguageProvider>
                  <LanguageWrapper>
                    <ProtectedRoute>
                      <AdminPage />
                    </ProtectedRoute>
                  </LanguageWrapper>
                </LanguageProvider>
              } />
              <Route path="/:lang/admin/project/:projectId" element={
                <LanguageProvider>
                  <LanguageWrapper>
                    <ProtectedRoute>
                      <ProjectEditorPage />
                    </ProtectedRoute>
                  </LanguageWrapper>
                </LanguageProvider>
              } />

              {/* Embed routes without language prefix but with EmbedLanguageProvider */}
              <Route path="/embed/projects/:userId" element={<EmbedLanguageProvider><EmbedProjectsPage /></EmbedLanguageProvider>} />
              <Route path="/embed/project/:projectId" element={<EmbedLanguageProvider><ProjectWidgetPage /></EmbedLanguageProvider>} />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
