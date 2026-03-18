import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import ProjectWidgetPage from "@/pages/ProjectWidgetPage";
import { EmbedProviders } from "@/app/providers";

// Lazy load pages
const ApartmentDetailsPage = lazy(() => import("@/pages/ApartmentDetailsPage"));
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
const ChangelogPage = lazy(() => import("@gridix/ui/changelog-page"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const withLocalSuspense = (element: ReactNode) => (
  <Suspense fallback={null}>{element}</Suspense>
);

export function PublicRoutes() {
  return (
    <Routes>
      <Route index element={<Index />} />

      {/* Widget routes */}
      <Route path="widget/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
      <Route
        path="project/:projectSlug/apartment/:apartmentNumber"
        element={withLocalSuspense(<ApartmentDetailsPage />)}
      />
      <Route
        path="project/:projectSlug/apartment/:apartmentNumber/pdf"
        element={withLocalSuspense(<PDFTemplatePage />)}
      />

      {/* Auth routes */}
      <Route path="auth" element={withLocalSuspense(<AuthRedirectPage />)} />
      <Route
        path="auth/signin"
        element={withLocalSuspense(<AuthRedirectPage />)}
      />
      <Route
        path="auth/signup"
        element={withLocalSuspense(<AuthRedirectPage />)}
      />

      {/* Set password */}
      <Route
        path="set-password"
        element={withLocalSuspense(<SetPasswordPage />)}
      />

      {/* Invitation handler route - processes partner invitations */}
      <Route
        path="invitation"
        element={withLocalSuspense(<InvitationHandlerPage />)}
      />

      {/* Agent routes */}
      <Route
        path="projects/agent/:agentId"
        element={withLocalSuspense(<AgentProjectsPage />)}
      />
      <Route
        path="agent/apply"
        element={withLocalSuspense(<AgentApplicationPage />)}
      />

      {/* Bitrix routes */}
      <Route
        path="connect/bitrix24"
        element={
          <EmbedProviders>
            {withLocalSuspense(<BitrixInstallPage />)}
          </EmbedProviders>
        }
      />
      <Route
        path="bitrix"
        element={
          <EmbedProviders>{withLocalSuspense(<BitrixPage />)}</EmbedProviders>
        }
      />

      <Route path="changelog" element={<ChangelogPage standalone={true} />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
