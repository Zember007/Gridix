import { Navigate, useLocation } from "react-router-dom";
import { getLanguageFromPath } from "@gridix/utils/lib";

export default function AmoCrmLeadLinkPage() {
  const location = useLocation();
  const lang = getLanguageFromPath(location.pathname) || "ru";
  const search = location.search || "";

  return <Navigate to={`/${lang}/amocrm${search}`} replace />;
}
