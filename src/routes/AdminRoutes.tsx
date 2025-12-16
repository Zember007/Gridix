import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";

// Lazy load admin pages
const AdminPage = lazy(() => import("../pages/AdminPage"));
const ProjectEditorPage = lazy(() => import("../pages/ProjectEditorPage"));
const DeveloperProjectsPage = lazy(
  () => import("../pages/DeveloperProjectsPage")
);
const AdminAnalyticsPage = lazy(
  () => import("../pages/AdminAnalyticsPage")
);

export function AdminRoutes() {
  return (
    <Routes>
      {/* Admin main page */}
      <Route
        index
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Developer projects cabinet without sidebar */}
      <Route
        path="developer-projects"
        element={
          <ProtectedRoute>
            <DeveloperProjectsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin analytics page without sidebar */}
      <Route
        path="developer-analytics"
        element={
          <ProtectedRoute>
            <AdminAnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* Project editor */}
      <Route
        path="project/:projectSlug"
        element={
          <ProtectedRoute>
            <ProjectEditorPage />
          </ProtectedRoute>
        }
      />

      {/* Backward compatibility for admin */}
      <Route
        path="project/id/:projectId"
        element={
          <ProtectedRoute>
            <ProjectEditorPage useId />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

