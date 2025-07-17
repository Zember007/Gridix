
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DEFAULT_LANGUAGE, getLanguagePrefix } from "@/lib/language-utils";
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

              {/* Language-specific routes */}
              {/* Russian routes */}
              <Route path="/ru" element={<Index />} />
              <Route path="/ru/projects" element={<ProjectsGalleryPage />} />
              <Route path="/ru/widget/:projectId" element={<ProjectWidgetPage />} />
              <Route path="/ru/project/:projectId" element={<ProjectWidgetPage />} />
              <Route path="/ru/admin" element={<AdminPage />} />
              <Route path="/ru/admin/project/:projectId" element={<ProjectEditorPage />} />

              {/* English routes */}
              <Route path="/en" element={<Index />} />
              <Route path="/en/projects" element={<ProjectsGalleryPage />} />
              <Route path="/en/widget/:projectId" element={<ProjectWidgetPage />} />
              <Route path="/en/project/:projectId" element={<ProjectWidgetPage />} />
              <Route path="/en/admin" element={<AdminPage />} />
              <Route path="/en/admin/project/:projectId" element={<ProjectEditorPage />} />

              {/* Georgian routes (using /ge/ prefix as requested) */}
              <Route path="/ge" element={<Index />} />
              <Route path="/ge/projects" element={<ProjectsGalleryPage />} />
              <Route path="/ge/widget/:projectId" element={<ProjectWidgetPage />} />
              <Route path="/ge/project/:projectId" element={<ProjectWidgetPage />} />
              <Route path="/ge/admin" element={<AdminPage />} />
              <Route path="/ge/admin/project/:projectId" element={<ProjectEditorPage />} />

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
