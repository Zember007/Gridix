import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useLanguage } from "@gridix/utils/react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminAccess } from "@/entities/admin-access";
import { useAmoWidget } from "@/hooks/useAmoWidget";

import type { AdminShellSidebarSlot } from "@/app/layouts/admin-shell-context";

import {
  getBrowserQueryPage,
  getAdminNavItems,
} from "@/shared/ui/sidebar-component";
import { DemoExitCollapsedBridge } from "../ui/DemoExitCollapsedBridge";

type UseAdminDashboardShellSidebarArgs = {
  blocked: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userEmail: string;
  crmUnreadCount: number;
  onSignOut?: () => Promise<void> | void;
  isSigningOut: boolean;
};

export function useAdminDashboardShellSidebar({
  blocked,
  activeTab,
  setActiveTab,
  userEmail,
  crmUnreadCount,
  onSignOut,
  isSigningOut,
}: UseAdminDashboardShellSidebarArgs): AdminShellSidebarSlot | null {
  const { t } = useLanguage();
  const { isManager } = useUserRole();
  const { user, userProfile } = useAuth();
  const adminAccess = useAdminAccess();
  const { amoWidget } = useAmoWidget();

  const [activeSection, setActiveSection] = useState(
    () => activeTab || getBrowserQueryPage() || "projects",
  );

  const handleSectionChange = useCallback(
    (section: string) => {
      setActiveSection(section);
      startTransition(() => {
        setActiveTab(section);
      });
    },
    [setActiveTab],
  );

  useEffect(() => {
    setActiveSection(activeTab || getBrowserQueryPage() || "projects");
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const next = getBrowserQueryPage() || "projects";
      setActiveSection(next);
      setActiveTab(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setActiveTab]);

  const navItems = useMemo(
    () =>
      getAdminNavItems(
        t,
        isManager,
        amoWidget,
        crmUnreadCount,
        adminAccess?.isDemoViewer ?? false,
      ),
    [t, isManager, amoWidget, crmUnreadCount, adminAccess?.isDemoViewer],
  );

  return useMemo(() => {
    if (blocked) return null;

    return {
      kind: "dashboard",
      navItems,
      activeSection,
      onSectionChange: handleSectionChange,
      userEmail,
      title: t("adminSidebar.title"),
      showWorkspaceSwitcher: isManager || adminAccess?.isDemoWorkspace === true,
      showSupportButton: true,
      syncQueryParam: true,
      ...(onSignOut ? { onSignOut } : {}),
      isSigningOut,
      ...(user?.id ? { userId: user.id } : {}),
      preferredLocale: userProfile?.preferred_locale ?? undefined,
      exitDemoSlot:
        adminAccess?.isDemoWorkspace === true ? (
          <DemoExitCollapsedBridge />
        ) : undefined,
    };
  }, [
    activeSection,
    adminAccess?.isDemoWorkspace,
    blocked,
    handleSectionChange,
    isManager,
    isSigningOut,
    navItems,
    onSignOut,
    t,
    user?.id,
    userEmail,
    userProfile?.preferred_locale,
  ]);
}
