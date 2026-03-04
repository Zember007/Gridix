import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { SimplifiedSidebar, useIsMobile } from "@gridix/ui";
import { useAuth } from "@/shared/lib/auth";
import { useLanguage } from "@/shared/lib/language";
import { getAgentSidebarNavItems } from "../lib/nav-items";
import type { AgentCabinetPage } from "../model/page-routing";

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
            ? "md:ml-28 md:max-w-[calc(100vw-7rem)]"
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
