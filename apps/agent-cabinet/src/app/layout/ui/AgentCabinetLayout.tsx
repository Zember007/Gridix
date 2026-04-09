import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { SimplifiedSidebar, useIsMobile } from "@gridix/ui";
import { useAuth } from "@/shared/lib/auth";
import { useLanguage } from "@/shared/lib/language";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { supabase } from "@gridix/utils/api";
import { Eye, SpinnerGap } from "@phosphor-icons/react";
import { getAgentSidebarNavItems } from "../lib/nav-items";
import type { AgentCabinetPage } from "../model/page-routing";

const MAIN_APP_URL =
  (import.meta.env as { VITE_MAIN_APP_URL?: string }).VITE_MAIN_APP_URL ??
  "https://app.gridix.live";

function DemoCabinetButton({ isCollapsed }: { isCollapsed: boolean }) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const label = loading
    ? t("admin.demo.joining") || "..."
    : t("common.demoCabinetButton") || "Кабинет застройщика";

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
          <SpinnerGap size={20} className="flex-shrink-0 animate-spin" />
        ) : (
          <Eye size={20} className="flex-shrink-0" />
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

interface Props {
  children: ReactNode;
  activePage: AgentCabinetPage;
  onChangePage: (page: AgentCabinetPage) => void;
}

export function AgentCabinetLayout({
  children,
  activePage,
  onChangePage,
}: Props) {
  const { t } = useLanguage();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = useMemo(() => getAgentSidebarNavItems(t), [t]);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <SimplifiedSidebar
        navItems={navItems}
        activeSection={activePage}
        onSectionChange={(section) => onChangePage(section as AgentCabinetPage)}
        userEmail={user?.email ?? ""}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        title={t("common.app.title")}
        showWorkspaceSwitcher
        syncQueryParam={false}
        workspaceExtra={<DemoCabinetButton isCollapsed={isCollapsed} />}
        isMobile={Boolean(isMobile)}
        mobileOpen={isMobileOpen}
        onMobileOpenChange={setIsMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        showSupportButton
        {...(user?.id ? { userId: user.id } : {})}
        onSignOut={() => {
          void signOut();
        }}
      />

      <div
        className={`flex min-w-0 flex-1 flex-col bg-background transition-all duration-300 ${
          isCollapsed && !isMobile
            ? "md:ml-24 md:max-w-[calc(100vw-6rem)]"
            : "md:ml-64 md:max-w-[calc(100vw-16rem)]"
        }`}
      >
        <main className="h-screen min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
