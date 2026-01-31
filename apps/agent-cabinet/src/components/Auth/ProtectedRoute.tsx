import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getLanguageFromPath, addLanguageToPath, removeLanguageFromPath } from "@gridix/utils/lib";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!requireAuth) return <>{children}</>;
  if (user) return <>{children}</>;

  const lang = getLanguageFromPath(location.pathname);
  const clean = removeLanguageFromPath(location.pathname);
  const redirectTo = addLanguageToPath("/auth", lang);

  return (
    <Navigate
      to={`${redirectTo}?next=${encodeURIComponent(clean + location.search)}`}
      replace
    />
  );
}

