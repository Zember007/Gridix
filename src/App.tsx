
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DEFAULT_LANGUAGE, getLanguagePrefix } from "@/lib/language-utils";
import LanguageWrapper from "@/components/LanguageWrapper";
import Index from "./pages/Index";
import ProjectsGalleryPage from "./pages/ProjectsGalleryPage";
import ProjectWidgetPage from "./pages/ProjectWidgetPage";
import AdminPage from "./pages/AdminPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import EmbedProjectsPage from "./pages/EmbedProjectsPage";
import EmbedProjectsMap from "./pages/EmbedProjectsMap";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <LanguageProvider>
            <Routes>
              {/* Default route - redirect to default language */}
              <Route path="/" element={<Navigate to={getLanguagePrefix(DEFAULT_LANGUAGE)} replace />} />

              {/* Language-specific routes with :lang parameter */}
              <Route path="/:lang" element={<LanguageWrapper><Index /></LanguageWrapper>} />
              <Route path="/:lang/projects" element={<LanguageWrapper><ProjectsGalleryPage /></LanguageWrapper>} />
              <Route path="/:lang/widget/:projectId" element={<LanguageWrapper><ProjectWidgetPage /></LanguageWrapper>} />
              <Route path="/:lang/project/:projectId" element={<LanguageWrapper><ProjectWidgetPage /></LanguageWrapper>} />
              <Route path="/:lang/admin" element={<LanguageWrapper><AdminPage /></LanguageWrapper>} />
              <Route path="/:lang/admin/project/:projectId" element={<LanguageWrapper><ProjectEditorPage /></LanguageWrapper>} />

              {/* Embed routes without language prefix */}
              <Route path="/embed/projects" element={<EmbedProjectsPage />} />
              <Route path="/embed/project/:projectId" element={<ProjectWidgetPage embedMode={true} />} />
              <Route path="/embed/projects-map" element={<EmbedProjectsMap />} />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
