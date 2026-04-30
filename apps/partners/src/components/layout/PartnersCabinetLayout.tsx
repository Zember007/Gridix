/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SimplifiedSidebar, type SimplifiedSidebarNavItem } from "@gridix/ui";
import { IconLoader2 } from "@tabler/icons-react";
import { BarChart3, BookOpen, Eye, UserCircle, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@gridix/ui";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { supabase } from "@gridix/utils/api";
import type { PartnerSection } from "@gridix/partner-program";

const MAIN_APP_URL =
  (import.meta.env as { VITE_MAIN_APP_URL?: string }).VITE_MAIN_APP_URL ??
  "https://app.gridix.live";

function DemoCabinetButton({ isCollapsed }: { isCollapsed: boolean }) {
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
    <div
      className="px-3 py-2"
      style={{ borderBottom: `1px solid ${ADMIN_THEME.sidebarBorder}` }}
    >
      <button
        type="button"
        title={label}
        onClick={() => void handleClick()}
        disabled={loading}
        className={`flex w-full rounded-lg transition-colors duration-200 disabled:opacity-50 ${
          isCollapsed
            ? "flex-col items-center gap-1 px-1 py-2 text-center"
            : "items-center gap-3 px-3 py-2 text-left"
        }`}
        style={{
          color: "#fbbf24",
          backgroundColor: "transparent",
          border: "1px solid transparent",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor =
            ADMIN_THEME.sidebarActiveBackground;
          e.currentTarget.style.borderColor = ADMIN_THEME.sidebarActiveBorder;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.borderColor = "transparent";
        }}
      >
        {loading ? (
          <IconLoader2 size={20} className="flex-shrink-0 animate-spin" />
        ) : (
          <Eye className="h-5 w-5 flex-shrink-0" />
        )}
        <span
          className={`font-medium ${
            isCollapsed
              ? "break-words text-center text-xs"
              : "min-w-0 flex-1 truncate text-sm"
          }`}
          style={isCollapsed ? { lineHeight: "1.2" } : {}}
        >
          {isCollapsed ? "Demo" : label}
        </span>
      </button>
    </div>
  );
}

export type PartnersCabinetPage = PartnerSection | "changelog";

const getQueryPage = (search: string): PartnersCabinetPage | null => {
  const page = new URLSearchParams(search).get("page");
  const validPages: PartnersCabinetPage[] = [
    "overview",
    "referrals",
    "clients",
    "instructions",
    "account",
    "changelog",
  ];
  if (validPages.includes(page as PartnersCabinetPage))
    return page as PartnersCabinetPage;
  return null;
};

const setQueryPage = (
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>,
  page: PartnersCabinetPage,
) => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === page) return;
  url.searchParams.set("page", page);
  navigate(`${location.pathname}${url.search}`, { replace: true });
};

export function PartnersCabinetLayout({
  children,
  activePage,
  onChangePage,
}: {
  children: ReactNode;
  activePage: PartnersCabinetPage;
  onChangePage: (p: PartnersCabinetPage) => void;
}) {
  const { language, t } = useLanguage();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = useMemo<SimplifiedSidebarNavItem[]>(
    () => [
      {
        id: "overview",
        icon: <Eye className="h-5 w-5" />,
        label: t("partners.overview"),
      },
      {
        id: "referrals",
        icon: <Users className="h-5 w-5" />,
        label: t("partners.referrals"),
      },
      {
        id: "clients",
        icon: <BarChart3 className="h-5 w-5" />,
        label: t("partners.clients"),
      },
      {
        id: "instructions",
        icon: <BookOpen className="h-5 w-5" />,
        label: t("partners.instructions"),
      },
      {
        id: "account",
        icon: <UserCircle className="h-5 w-5" />,
        label: t("partners.account"),
      },
    ],
    [t],
  );

  const sidebar = (
    <SimplifiedSidebar
      navItems={navItems}
      activeSection={activePage}
      onSectionChange={(section) => onChangePage(section as PartnerSection)}
      userEmail={user?.email ?? ""}
      isCollapsed={isCollapsed}
      onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      title={t("common.app.title")}
      showWorkspaceSwitcher={false}
      syncQueryParam={false}
      workspaceExtra={<DemoCabinetButton isCollapsed={isCollapsed} />}
      isMobile={Boolean(isMobile)}
      mobileOpen={isMobileOpen}
      onMobileOpenChange={setIsMobileOpen}
      onMobileClose={() => setIsMobileOpen(false)}
      showSupportButton={true}
      {...(user?.id ? { userId: user.id } : {})}
      onSignOut={() => {
        void (async () => {
          await signOut();
          window.location.href = `/${language}/auth`;
        })();
      }}
    />
  );

  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}

      <div
        className={`flex flex-1 flex-col bg-background transition-all duration-300 ${
          isCollapsed && !isMobile
            ? "md:ml-24 md:max-w-[calc(100vw-6rem)]"
            : "md:ml-64 md:max-w-[calc(100vw-16rem)]"
        }`}
      >
        <main className="h-screen flex-1 overflow-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}

export function usePartnersCabinetPageRouting() {
  const location = useLocation();
  const navigate = useNavigate();

  const activePage: PartnersCabinetPage =
    getQueryPage(location.search) ?? "overview";
  const setActivePage = (p: PartnersCabinetPage) =>
    setQueryPage(navigate, location, p);

  return { activePage, setActivePage };
}
