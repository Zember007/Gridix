import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import { EmbedProviders } from "@/app/providers";

// Lazy load pages
const ApartmentDetailsPage = lazy(() => import("@/pages/ApartmentDetailsPage"));
const ProjectWidgetPage = lazy(() => import("@/pages/ProjectWidgetPage"));
const AuthRedirectPage = lazy(() => import("@/pages/AuthRedirectPage"));
const SetPasswordPage = lazy(() => import("@/pages/SetPasswordPage"));
const PDFTemplatePage = lazy(() => import("@/pages/PDFTemplatePage"));
const InvitationHandlerPage = lazy(
  () => import("@/pages/InvitationHandlerPage"),
);
const AgentProjectsPage = lazy(() => import("@/pages/AgentProjectsPage"));
const AgentApplicationPage = lazy(() => import("@/pages/AgentApplicationPage"));
const BitrixInstallPage = lazy(
  () => import("@/pages/bitrix/BitrixInstallPage"),
);
const BitrixPage = lazy(() => import("@/pages/bitrix/BitrixPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

export function PublicRoutes() {
  return (
    <Routes>
      <Route index element={<Index />} />

      {/* Widget routes */}
      <Route path="widget/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
      <Route
        path="project/:projectSlug/apartment/:apartmentNumber"
        element={<ApartmentDetailsPage />}
      />
      <Route
        path="project/:projectSlug/apartment/:apartmentNumber/pdf"
        element={<PDFTemplatePage />}
      />

      {/* Auth routes */}
      <Route path="auth" element={<AuthRedirectPage />} />
      <Route path="auth/signin" element={<AuthRedirectPage />} />
      <Route path="auth/signup" element={<AuthRedirectPage />} />

      {/* Set password */}
      <Route path="set-password" element={<SetPasswordPage />} />

      {/* Invitation handler route - processes partner invitations */}
      <Route path="invitation" element={<InvitationHandlerPage />} />

      {/* Agent routes */}
      <Route path="projects/agent/:agentId" element={<AgentProjectsPage />} />
      <Route path="agent/apply" element={<AgentApplicationPage />} />

      {/* Bitrix routes */}
      <Route
        path="connect/bitrix24"
        element={
          <EmbedProviders>
            <BitrixInstallPage />
          </EmbedProviders>
        }
      />
      <Route
        path="bitrix"
        element={
          <EmbedProviders>
            <BitrixPage />
          </EmbedProviders>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
