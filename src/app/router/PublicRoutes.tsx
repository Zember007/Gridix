import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";

// Lazy load pages
const ApartmentDetailsPage = lazy(() => import("@/pages/ApartmentDetailsPage"));
const ProjectWidgetPage = lazy(() => import("@/pages/ProjectWidgetPage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const SetPasswordPage = lazy(() => import("@/pages/SetPasswordPage"));
const PDFTemplatePage = lazy(() => import("@/pages/PDFTemplatePage"));
const InvitationHandlerPage = lazy(() => import("@/pages/InvitationHandlerPage"));

export function PublicRoutes() {
  return (
    <Routes>
      <Route index element={<Index />} />

      {/* Widget routes */}
      <Route path="widget/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="project/:projectSlug/apartment/:apartmentNumber" element={<ApartmentDetailsPage />} />
      <Route path="project/:projectSlug/apartment/:apartmentNumber/pdf" element={<PDFTemplatePage />} />

      {/* Auth routes */}
      <Route path="auth" element={<AuthPage />} />
      <Route path="auth/signin" element={<AuthPage />} />
      <Route path="auth/signup" element={<AuthPage />} />

      {/* Set password */}
      <Route path="set-password" element={<SetPasswordPage />} />

      {/* Invitation handler route - processes partner invitations */}
      <Route path="invitation" element={<InvitationHandlerPage />} />
    </Routes>
  );
}

