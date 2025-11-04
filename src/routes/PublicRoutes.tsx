import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DEFAULT_LANGUAGE } from "@/lib/language-utils";
import Index from "@/pages/Index";

// Lazy load pages
const ApartmentDetailsPage = lazy(() => import("../pages/ApartmentDetailsPage"));
const ProjectWidgetPage = lazy(() => import("../pages/ProjectWidgetPage"));
const AuthPage = lazy(() => import("../pages/AuthPage"));
const SetPasswordPage = lazy(() => import("../pages/SetPasswordPage"));
const PDFTemplatePage = lazy(() => import("../pages/PDFTemplatePage"));
const PrivacyPolicyPage = lazy(() => import("../pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("../pages/TermsOfServicePage"));
const RefundPolicyPage = lazy(() => import("../pages/RefundPolicyPage"));
const PricingPage = lazy(() => import("../pages/PricingPage"));
const ContactsPage = lazy(() => import("../pages/ContactsPage"));
const InvitationHandlerPage = lazy(() => import("../pages/InvitationHandlerPage"));
const PartnerProgramPage = lazy(() => import("../pages/PartnerProgramPage"));

export function PublicRoutes() {
  return (
    <Routes>
      {/* Main page */}
      <Route index element={<Index />} />

      {/* Widget routes */}
      <Route path="widget/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="project/:projectSlug" element={<ProjectWidgetPage />} />
      <Route path="project/:projectSlug/apartment/:apartmentNumber" element={<ApartmentDetailsPage />} />
      <Route path="project/:projectSlug/apartment/:apartmentNumber/pdf" element={<PDFTemplatePage />} />

      {/* Backward compatibility routes - redirect old ID-based URLs to new slug-based ones */}
      <Route path="widget/id/:projectId" element={<ProjectWidgetPage useId />} />
      <Route path="project/id/:projectId" element={<ProjectWidgetPage useId />} />
      <Route path="project/id/:projectId/apartment/id/:apartmentId" element={<ApartmentDetailsPage useId />} />
      <Route path="project/id/:projectId/apartment/id/:apartmentId/pdf" element={<PDFTemplatePage useId />} />

      {/* Legal pages */}
      <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="terms-of-service" element={<TermsOfServicePage />} />
      <Route path="refund-policy" element={<RefundPolicyPage />} />

      {/* Contacts Page */}
      <Route path="contacts" element={<ContactsPage />} />

      {/* Public Pricing Page */}
      <Route path="pricing" element={<PricingPage />} />
      <Route path="price" element={<PricingPage />} />

      {/* Partner Program Page */}
      <Route path="partner-program" element={<PartnerProgramPage />} />

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

