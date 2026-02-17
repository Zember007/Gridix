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
  UserCircle as UserIcon,
  Users,
  BookOpen,
  Eye,
} from "@phosphor-icons/react";
import { Menu } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@gridix/ui";
import type { PartnerSection } from "@gridix/partner-program";

const getQueryPage = (search: string): PartnerSection | null => {
  const page = new URLSearchParams(search).get("page");
  const validPages: PartnerSection[] = [
    "overview",
    "referrals",
    "clients",
    "instructions",
    "account",
  ];
  if (validPages.includes(page as PartnerSection))
    return page as PartnerSection;
  return null;
};

const setQueryPage = (
  navigate: ReturnType<typeof useNavigate>,
  location: ReturnType<typeof useLocation>,
  page: PartnerSection,
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
  activePage: PartnerSection;
  onChangePage: (p: PartnerSection) => void;
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
            <span className="ml-2 font-semibold">{t("partners.title")}</span>
          </div>
        ) : null}

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

  const activePage: PartnerSection =
    getQueryPage(location.search) ?? "overview";
  const setActivePage = (p: PartnerSection) =>
    setQueryPage(navigate, location, p);

  return { activePage, setActivePage };
}
