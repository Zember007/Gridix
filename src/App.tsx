
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProjectViewer from "./components/ProjectViewer";
import EmbeddedWidget from "./components/EmbeddedWidget";
import AdminDashboard from "./components/AdminDashboard";
import ProjectEditor from "./components/ProjectEditor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminDashboard onBack={() => window.location.href = '/'} />} />
          <Route path="/admin/project/:projectId" element={<ProjectEditorWrapper />} />
          <Route path="/admin/project/new" element={<ProjectEditorWrapper isNew />} />
          <Route path="/project/:projectId" element={<ProjectViewer />} />
          <Route path="/widget/:projectId" element={<EmbeddedWidget />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Wrapper component for ProjectEditor to handle routing
const ProjectEditorWrapper = ({ isNew = false }: { isNew?: boolean }) => {
  const { projectId } = require('react-router-dom').useParams();
  const navigate = require('react-router-dom').useNavigate();
  
  return (
    <ProjectEditor 
      projectId={isNew ? 'new' : projectId}
      isNew={isNew}
      onBack={() => navigate('/admin')}
    />
  );
};

export default App;
