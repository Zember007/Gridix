import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Sheet, SheetContent, SimplifiedSidebar } from "@gridix/ui";
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
const getQueryPage = (search) => {
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
    onMobileClose: () => setIsMobileOpen(false),
    onSignOut: () => {
      void (async () => {
        await signOut();
        window.location.href = `/${language}/auth`;
      })();
    },
  });
  return _jsxs("div", {
    className: "min-h-screen bg-background flex",
    children: [
      isMobile
        ? _jsx(Sheet, {
            open: isMobileOpen,
            onOpenChange: setIsMobileOpen,
            children: _jsx(SheetContent, {
              side: "left",
              className: "p-0 w-80",
              children: sidebar,
            }),
          })
        : sidebar,
      _jsxs("div", {
        className: `flex-1 bg-background flex flex-col transition-all duration-300 ${isCollapsed && !isMobile ? "md:ml-28 md:max-w-[calc(100vw-7rem)]" : "md:ml-64 md:max-w-[calc(100vw-16rem)]"}`,
        children: [
          isMobile
            ? _jsxs("div", {
                className:
                  "p-4 border-b flex items-center bg-white sticky top-0 z-20",
                children: [
                  _jsx(Button, {
                    variant: "ghost",
                    size: "icon",
                    onClick: () => setIsMobileOpen(true),
                    children: _jsx(Menu, { className: "h-6 w-6" }),
                  }),
                  _jsx("span", {
                    className: "ml-2 font-semibold",
                    children: t("common.app.title"),
                  }),
                ],
              })
            : null,
          _jsx("main", {
            className: "flex-1 overflow-auto h-screen bg-[#F8FAFC]",
            children: children,
          }),
        ],
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
