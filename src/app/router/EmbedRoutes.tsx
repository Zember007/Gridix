import { Routes, Route } from "react-router-dom";
import ProjectWidgetPage from "@/pages/ProjectWidgetPage";
import EmbedProjectsPage from "@/pages/EmbedProjectsPage";

export function EmbedRoutes() {
  return (
    <Routes>
      {/* Embed project routes */}
      <Route path="projects/:userId" element={<EmbedProjectsPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
    </Routes>
  );
}

