import { Routes, Route } from "react-router-dom";
import ProjectWidgetPage from "@/pages/ProjectWidgetPage";
import EmbedProjectsPage from "@/pages/EmbedProjectsPage";
import BitrixInstallPage from "@/pages/bitrix/BitrixInstallPage";
import BitrixProjectsPage from "@/pages/bitrix/BitrixProjectsPage";
import BitrixDealTabPage from "@/pages/bitrix/BitrixDealTabPage";

export function EmbedRoutes() {
  return (
    <Routes>
      {/* Embed project routes */}
      <Route path="projects/:userId" element={<EmbedProjectsPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="connect/bitrix24" element={<BitrixInstallPage />} />
      <Route path="bitrix/projects" element={<BitrixProjectsPage />} />
      <Route path="bitrix/deal-tab" element={<BitrixDealTabPage />} />
    </Routes>
  );
}

