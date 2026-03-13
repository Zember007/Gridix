import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { LanguageWrapper, NoWorkspaceProvider } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import { AuthProvider, useAuth } from "@/app/providers/AuthProvider";
import SuperAdminPage from "@/pages/SuperAdminPage";
import { useSuperAdmin } from "@/features/superadmin/model/useSuperAdmin";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";

function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
        <p className="mt-2 text-sm text-slate-600">
          This cabinet is available only for users with the superadmin role.
        </p>
      </div>
    </div>
  );
}

function ProtectedSuperAdminRoute() {
  const { user, loading } = useAuth();
  const { isSuperAdmin, loading: roleLoading } = useSuperAdmin();
  const location = useLocation();
  const redirectStartedRef = useRef(false);

  const isAuthCallback =
    typeof window !== "undefined" &&
    (window.location.hash.includes("access_token=") ||
      new URLSearchParams(location.search).get("code"));
  const ssoBase = import.meta.env.VITE_SSO_URL?.trim();
  const language =
    typeof window !== "undefined"
      ? window.location.pathname.split("/")[1] || "en"
      : "en";
  const fullCurrent =
    typeof window !== "undefined"
      ? window.location.origin + location.pathname + (location.search || "")
      : "";

  useEffect(() => {
    if (loading || roleLoading || user || isAuthCallback || !ssoBase) {
      redirectStartedRef.current = false;
      return;
    }

    if (redirectStartedRef.current) return;
    redirectStartedRef.current = true;

    window.location.replace(
      `${ssoBase.replace(/\/$/, "")}/${language}/auth/signin?redirect_to=${encodeURIComponent(fullCurrent)}`,
    );
  }, [
    fullCurrent,
    isAuthCallback,
    language,
    loading,
    roleLoading,
    ssoBase,
    user,
  ]);

  if (loading || roleLoading) {
    return <FullPageLoaderView />;
  }

  if (!user) {
    if (isAuthCallback) {
      return <FullPageLoaderView />;
    }

    if (ssoBase) {
      return <FullPageLoaderView />;
    }

    return <AccessDenied />;
  }

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  return <SuperAdminPage />;
}

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <AuthProvider>
            <NoWorkspaceProvider>
              <Routes>
                <Route path="/" element={<Navigate to="/en/" replace />} />
                <Route path="/:lang/*" element={<ProtectedSuperAdminRoute />} />
              </Routes>
            </NoWorkspaceProvider>
          </AuthProvider>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}
