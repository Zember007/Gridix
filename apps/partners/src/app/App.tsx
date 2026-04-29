import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { LanguageWrapper, NoWorkspaceProvider } from "@gridix/utils/react";
import { BaseProviders } from "@/app/providers/BaseProviders";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import {
  PartnersCabinetLayout,
  type PartnersCabinetPage,
  usePartnersCabinetPageRouting,
} from "@/components/layout/PartnersCabinetLayout";
import { PartnerProgram } from "@gridix/partner-program";
import { IconLoader2 } from "@tabler/icons-react";
import { Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@gridix/utils/api";

const MAIN_APP_URL =
  (import.meta.env as { VITE_MAIN_APP_URL?: string }).VITE_MAIN_APP_URL ??
  "https://app.gridix.live";

function OpenMainAppButton() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const label = loading
    ? t("admin.demo.joining") || "..."
    : t("partners.demoCabinetButton") || "Кабинет застройщика";

  const handleClick = async () => {
    setLoading(true);
    try {
      const [joinResult, sessionResult] = await Promise.all([
        supabase.functions.invoke("join-demo"),
        supabase.auth.getSession(),
      ]);
      const developerId = joinResult.data?.developer_id as string | undefined;
      const session = sessionResult.data.session;

      const url = new URL(MAIN_APP_URL);
      if (developerId) url.searchParams.set("demo_workspace", developerId);

      let target = url.toString();
      if (session) {
        target += `#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=magiclink`;
      }

      window.open(target, "_self", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
      >
        {loading ? (
          <IconLoader2 size={18} className="flex-shrink-0 animate-spin" />
        ) : (
          <Eye className="h-[18px] w-[18px] flex-shrink-0" />
        )}
        {label}
      </button>
    </div>
  );
}
import { ChangelogPage } from "@gridix/ui";

import SetPasswordPage from "@/pages/SetPasswordPage";
import NotFound from "@/pages/NotFound";

function PartnersCabinetRouter() {
  const { activePage, setActivePage } = usePartnersCabinetPageRouting();
  const isChangelog = activePage === "changelog";

  return (
    <PartnersCabinetLayout activePage={activePage} onChangePage={setActivePage}>
      {isChangelog ? (
        <ChangelogPage />
      ) : (
        <div className="p-4 md:p-6">
          <PartnerProgram
            navigationMode="sidebar"
            activeSection={
              activePage as Exclude<PartnersCabinetPage, "changelog">
            }
            onSectionChange={(section) => setActivePage(section)}
            autoCreateProfile
            joinDemoSlot={<OpenMainAppButton />}
          />
        </div>
      )}
    </PartnersCabinetLayout>
  );
}

function LegacyRedirect() {
  const { lang } = useParams();
  return <Navigate to={`/${lang ?? "ru"}/`} replace />;
}

export default function App() {
  return (
    <BaseProviders>
      <BrowserRouter>
        <LanguageWrapper>
          <AuthProvider>
            <NoWorkspaceProvider>
              <Routes>
                <Route
                  path="/:lang/"
                  element={
                    <ProtectedRoute>
                      <PartnersCabinetRouter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/:lang/set-password"
                  element={
                    <ProtectedRoute>
                      <SetPasswordPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/:lang/auth" element={<LegacyRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NoWorkspaceProvider>
          </AuthProvider>
        </LanguageWrapper>
      </BrowserRouter>
    </BaseProviders>
  );
}
