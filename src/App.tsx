
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
              {/* Default route - redirect to default language */}
              <Route path="/" element={<Navigate to={getLanguagePrefix(DEFAULT_LANGUAGE)} replace />} />

              {/* Language-specific routes with :lang parameter */}
              <Route path="/:lang" element={<LanguageProvider><LanguageWrapper><Index /></LanguageWrapper></LanguageProvider>} />
              <Route path="/:lang/projects" element={<LanguageProvider><LanguageWrapper><ProjectsGalleryPage /></LanguageWrapper></LanguageProvider>} />
              <Route path="/:lang/widget/:projectId" element={<LanguageProvider><LanguageWrapper><ProjectWidgetPage /></LanguageWrapper></LanguageProvider>} />
              <Route path="/:lang/project/:projectId" element={<LanguageProvider><LanguageWrapper><ProjectWidgetPage /></LanguageWrapper></LanguageProvider>} />
              
              {/* Auth routes */}
              <Route path="/:lang/auth" element={<LanguageProvider><LanguageWrapper><AuthPage /></LanguageWrapper></LanguageProvider>} />
              
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
              <Route path="/embed/projects" element={<EmbedLanguageProvider><EmbedProjectsPage /></EmbedLanguageProvider>} />
              <Route path="/embed/project/:projectId" element={<EmbedLanguageProvider><ProjectWidgetPage embedMode={true} /></EmbedLanguageProvider>} />
              <Route path="/embed/projects-map" element={<EmbedLanguageProvider><EmbedProjectsMap /></EmbedLanguageProvider>} />

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
