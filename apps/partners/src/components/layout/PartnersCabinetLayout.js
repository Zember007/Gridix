import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SimplifiedSidebar } from "@gridix/ui";
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
const getQueryPage = (search) => {
  const page = new URLSearchParams(search).get("page");
  const validPages = [
    "overview",
    "referrals",
    "clients",
    "instructions",
    "account",
  ];
  if (validPages.includes(page)) return page;
  return null;
};
const setQueryPage = (navigate, location, page) => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === page) return;
  url.searchParams.set("page", page);
  navigate(`${location.pathname}${url.search}`, { replace: true });
};
export function PartnersCabinetLayout({ children, activePage, onChangePage }) {
  const { language, t } = useLanguage();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navItems = useMemo(
    () => [
      {
        id: "overview",
        icon: _jsx(Eye, { size: 20 }),
        label: t("partners.overview"),
      },
      {
        id: "referrals",
        icon: _jsx(Users, { size: 20 }),
        label: t("partners.referrals"),
      },
      {
        id: "clients",
        icon: _jsx(ChartBar, { size: 20 }),
        label: t("partners.clients"),
      },
      {
        id: "instructions",
        icon: _jsx(BookOpen, { size: 20 }),
        label: t("partners.instructions"),
      },
      {
        id: "account",
        icon: _jsx(UserIcon, { size: 20 }),
        label: t("partners.account"),
      },
    ],
    [t],
  );
  const sidebar = _jsx(SimplifiedSidebar, {
    navItems: navItems,
    activeSection: activePage,
    onSectionChange: (section) => onChangePage(section),
    userEmail: user?.email ?? "",
    isCollapsed: isCollapsed,
    onToggleCollapse: () => setIsCollapsed(!isCollapsed),
    title: t("common.app.title"),
    showWorkspaceSwitcher: false,
    syncQueryParam: false,
    isMobile: Boolean(isMobile),
    mobileOpen: isMobileOpen,
    onMobileOpenChange: setIsMobileOpen,
    onMobileClose: () => setIsMobileOpen(false),
    showSupportButton: true,
    onSignOut: () => {
      void (async () => {
        await signOut();
        window.location.href = `/${language}/auth`;
      })();
    },
  });
  return _jsxs("div", {
    className: "flex min-h-screen bg-background",
    children: [
      sidebar,
      _jsx("div", {
        className: `flex flex-1 flex-col bg-background transition-all duration-300 ${
          isCollapsed && !isMobile
            ? "md:ml-28 md:max-w-[calc(100vw-7rem)]"
            : "md:ml-64 md:max-w-[calc(100vw-16rem)]"
        }`,
        children: _jsx("main", {
          className: "h-screen flex-1 overflow-auto bg-[#F8FAFC]",
          children: children,
        }),
      }),
    ],
  });
}
export function usePartnersCabinetPageRouting() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = getQueryPage(location.search) ?? "overview";
  const setActivePage = (p) => setQueryPage(navigate, location, p);
  return { activePage, setActivePage };
}
