import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChartBar,
  Buildings as Building2,
  UserCircle as UserIcon,
  Stack as Layers3,
  Handshake,
  GearSix,
} from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@gridix/ui";
import { SimplifiedSidebar } from "@gridix/ui";
const getQueryPage = (search) => {
  const page = new URLSearchParams(search).get("page");
  if (
    page === "dashboard" ||
    page === "analytics" ||
    page === "contacts" ||
    page === "catalog" ||
    page === "partnerProgram" ||
    page === "settings"
  )
    return page;
  return null;
};
const setQueryPage = (navigate, location, page) => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("page") === page) return;
  url.searchParams.set("page", page);
  navigate(`${location.pathname}${url.search}`, { replace: true });
};
export function AgentCabinetLayout({ children, activePage, onChangePage }) {
  const { language, t } = useLanguage();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navItems = useMemo(
    () => [
      {
        id: "dashboard",
        icon: _jsx(Building2, { size: 20 }),
        label: t("common.nav.dashboard"),
      },
      {
        id: "contacts",
        icon: _jsx(UserIcon, { size: 20 }),
        label: t("common.nav.contacts"),
      },
      {
        id: "catalog",
        icon: _jsx(Layers3, { size: 20 }),
        label: t("common.nav.projects"),
      },
      {
        id: "analytics",
        icon: _jsx(ChartBar, { size: 20 }),
        label: t("common.nav.analytics"),
      },
      {
        id: "partnerProgram",
        icon: _jsx(Handshake, { size: 20 }),
        label: t("common.nav.partnerProgram"),
      },
      {
        id: "settings",
        icon: _jsx(GearSix, { size: 20 }),
        label: t("common.nav.settings"),
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
    showWorkspaceSwitcher: true,
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
    className: "flex min-h-screen overflow-x-hidden bg-background",
    children: [
      sidebar,
      _jsx("div", {
        className: `flex min-w-0 flex-1 flex-col bg-background transition-all duration-300 ${
          isCollapsed && !isMobile
            ? "md:ml-28 md:max-w-[calc(100vw-7rem)]"
            : "md:ml-64 md:max-w-[calc(100vw-16rem)]"
        }`,
        children: _jsx("main", {
          className:
            "h-screen min-w-0 flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC]",
          children: children,
        }),
      }),
    ],
  });
}
export function useAgentCabinetPageRouting() {
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = getQueryPage(location.search) ?? "dashboard";
  const setActivePage = (p) => setQueryPage(navigate, location, p);
  return { activePage, setActivePage };
}
