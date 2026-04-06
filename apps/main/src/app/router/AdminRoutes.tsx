import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth";

// Lazy load admin pages
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const ProjectEditorPage = lazy(() => import("@/pages/ProjectEditorPage"));
const SubProjectEditorPage = lazy(() => import("@/pages/SubProjectEditorPage"));

const AdminAnalyticsPage = lazy(() => import("@/pages/AdminAnalyticsPage"));
const AmoCrmLeadLinkPage = lazy(() => import("@/pages/AmoCrmLeadLinkPage"));

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

      {/* Sub-project editor */}
      <Route
        path="project/:projectSlug/sub/:subProjectSlug"
        element={
          <ProtectedRoute>
            <SubProjectEditorPage />
          </ProtectedRoute>
        }
      />

      {/* AmoCRM lead linking (iframe) */}
      <Route
        path="amocrm/lead-link"
        element={
          <ProtectedRoute>
            <AmoCrmLeadLinkPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
