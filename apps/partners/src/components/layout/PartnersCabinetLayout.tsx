/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SimplifiedSidebar, type SimplifiedSidebarNavItem } from "@gridix/ui";
import {
  ChartBar,
  UserCircle as UserIcon,
  Users,
  BookOpen,
  Eye,
} from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@gridix/ui";
import type { PartnerSection } from "@gridix/partner-program";

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
        icon: <Eye size={20} />,
        label: t("partners.overview"),
      },
      {
        id: "referrals",
        icon: <Users size={20} />,
        label: t("partners.referrals"),
      },
      {
        id: "clients",
        icon: <ChartBar size={20} />,
        label: t("partners.clients"),
      },
      {
        id: "instructions",
        icon: <BookOpen size={20} />,
        label: t("partners.instructions"),
      },
      {
        id: "account",
        icon: <UserIcon size={20} />,
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
