import { Routes, Route } from "react-router-dom";
import ProjectWidgetPage from "@/pages/ProjectWidgetPage";
import EmbedProjectsPage from "@/pages/EmbedProjectsPage";
import BitrixInstallPage from "@/pages/bitrix/BitrixInstallPage";

export function EmbedRoutes() {
  return (
    <Routes>
      {/* Embed project routes */}
      <Route path="projects/:userId" element={<EmbedProjectsPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="connect/bitrix24" element={<BitrixInstallPage />} />
    </Routes>
  );
}

