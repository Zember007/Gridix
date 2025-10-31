import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";

// Lazy load admin pages
const AdminPage = lazy(() => import("../pages/AdminPage"));
const ProjectEditorPage = lazy(() => import("../pages/ProjectEditorPage"));

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

