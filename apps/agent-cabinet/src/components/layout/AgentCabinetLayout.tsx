/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Sheet,
  SheetContent,
  SimplifiedSidebar,
  type SimplifiedSidebarNavItem,
} from "@gridix/ui";
import {
  ChartBar,
  Buildings as Building2,
  UserCircle as UserIcon,
  Stack as Layers3,
  Handshake,
} from "@phosphor-icons/react";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@gridix/ui";

export type AgentCabinetPage =
  | "dashboard"
  | "analytics"
  | "contacts"
  | "catalog"
  | "partnerProgram";

const getQueryPage = (search: string): AgentCabinetPage | null => {
  const page = new URLSearchParams(search).get("page");
  if (
    page === "dashboard" ||
    page === "analytics" ||
    page === "contacts" ||
    page === "catalog" ||
    page === "partnerProgram"
  )
    return page;
  return null;
};

const setQueryPage = (
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>,
  page: AgentCabinetPage,
) => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === page) return;
  url.searchParams.set("page", page);
  navigate(`${location.pathname}${url.search}`, { replace: true });
};

export function AgentCabinetLayout({
  children,
  activePage,
  onChangePage,
}: {
  children: ReactNode;
  activePage: AgentCabinetPage;
  onChangePage: (p: AgentCabinetPage) => void;
}) {
  const { language, t } = useLanguage();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = useMemo<SimplifiedSidebarNavItem[]>(
    () => [
      {
        id: "dashboard",
        icon: <Building2 size={20} />,
        label: t("common.nav.dashboard"),
      },
      {
        id: "contacts",
        icon: <UserIcon size={20} />,
        label: t("common.nav.contacts"),
      },
      {
        id: "catalog",
        icon: <Layers3 size={20} />,
        label: t("common.nav.projects"),
      },
      {
        id: "analytics",
        icon: <ChartBar size={20} />,
        label: t("common.nav.analytics"),
      },
      {
        id: "partnerProgram",
        icon: <Handshake size={20} />,
        label: t("common.nav.partnerProgram"),
      },
    ],
    [t],
  );

  const sidebar = (
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
      onMobileClose={() => setIsMobileOpen(false)}
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
      {isMobile ? (
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetContent side="left" className="w-80 p-0">
            {sidebar}
          </SheetContent>
        </Sheet>
      ) : (
        sidebar
      )}

      <div
        className={`flex flex-1 flex-col bg-background transition-all duration-300 ${
          isCollapsed && !isMobile
            ? "md:ml-28 md:max-w-[calc(100vw-7rem)]"
            : "md:ml-64 md:max-w-[calc(100vw-16rem)]"
        }`}
      >
        {isMobile ? (
          <div className="sticky top-0 z-20 flex items-center border-b bg-white p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <span className="ml-2 font-semibold">{t("common.app.title")}</span>
          </div>
        ) : null}

        <main className="h-screen flex-1 overflow-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}

export function useAgentCabinetPageRouting() {
  const location = useLocation();
  const navigate = useNavigate();

  const activePage = getQueryPage(location.search) ?? "dashboard";
  const setActivePage = (p: AgentCabinetPage) =>
    setQueryPage(navigate, location, p);

  return { activePage, setActivePage };
}
