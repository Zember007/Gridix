import { Routes, Route } from "react-router-dom";
import ProjectWidgetPage from "@/pages/ProjectWidgetPage";
import EmbedProjectsPage from "@/pages/EmbedProjectsPage";
import NotFound from "@/pages/NotFound";

export function EmbedRoutes() {
  return (
    <Routes>
      {/* Embed project routes */}
      <Route path="projects/:userId" element={<EmbedProjectsPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
      <Route
        path="project/id/:projectId"
        element={<ProjectWidgetPage useId />}
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
