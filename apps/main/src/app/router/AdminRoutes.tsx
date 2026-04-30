import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/features/auth";
import { AdminShellLayout } from "@/app/layouts/AdminShellLayout";
import ProjectEditorPage from "@/pages/ProjectEditorPage";
import SubProjectEditorPage from "@/pages/SubProjectEditorPage";

// Lazy load admin pages (editors eager so shell sidebar slot registers without Suspense gap)
const AdminPage = lazy(() => import("@/pages/AdminPage"));

const AdminAnalyticsPage = lazy(() => import("@/pages/AdminAnalyticsPage"));
const AmoCrmLeadLinkPage = lazy(() => import("@/pages/AmoCrmLeadLinkPage"));

export function AdminRoutes() {
  return (
    <Routes>
      {/* Admin dashboard + editors: single shell sidebar */}
      <Route
        element={
          <ProtectedRoute>
            <AdminShellLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminPage />} />
        <Route path="project/:projectSlug" element={<ProjectEditorPage />} />
        <Route
          path="project/:projectSlug/sub/:subProjectSlug"
          element={<SubProjectEditorPage />}
        />
      </Route>

      {/* Admin analytics page without sidebar */}
      <Route
        path="developer-analytics"
        element={
          <ProtectedRoute>
            <AdminAnalyticsPage />
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
