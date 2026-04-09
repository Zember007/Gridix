import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route } from "react-router-dom";

const ProjectWidgetPage = lazy(() => import("@/pages/ProjectWidgetPage"));
const SubProjectWidgetPage = lazy(() => import("@/pages/SubProjectWidgetPage"));
const EmbedProjectsPage = lazy(() => import("@/pages/EmbedProjectsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const withLocalSuspense = (element: ReactNode) => (
  <Suspense fallback={null}>{element}</Suspense>
);

export function EmbedRoutes() {
  return (
    <Routes>
      {/* Embed project routes */}
      <Route
        path="projects/:userId"
        element={withLocalSuspense(<EmbedProjectsPage />)}
      />
      <Route
        path="project/:projectSlug/p/:subSlug"
        element={withLocalSuspense(<SubProjectWidgetPage />)}
      />
      <Route
        path="project/id/:projectId/p/:subSlug"
        element={withLocalSuspense(<SubProjectWidgetPage />)}
      />
      <Route
        path="project/:projectSlug"
        element={withLocalSuspense(<ProjectWidgetPage />)}
      />
      <Route
        path="project/id/:projectId"
        element={withLocalSuspense(<ProjectWidgetPage useId />)}
      />
      <Route path="*" element={withLocalSuspense(<NotFound />)} />
    </Routes>
  );
}
