
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProjectWidgetPage from "./pages/ProjectWidgetPage";
import ProjectsGalleryPage from "./pages/ProjectsGalleryPage";
import EmbedProjectWidget from "./pages/EmbedProjectWidget";
import EmbedProjectsGallery from "./pages/EmbedProjectsGallery";
import EmbedProjectsMap from "./pages/EmbedProjectsMap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/project/:projectId" element={<ProjectWidgetPage />} />
          <Route path="/projects" element={<ProjectsGalleryPage />} />
          <Route path="/embed/project/:projectId" element={<EmbedProjectWidget />} />
          <Route path="/embed/projects" element={<EmbedProjectsGallery />} />
          <Route path="/embed/projects/map" element={<EmbedProjectsMap />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
