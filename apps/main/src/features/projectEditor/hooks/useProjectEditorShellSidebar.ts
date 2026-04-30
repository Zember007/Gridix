import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@gridix/utils/react";

import type { AdminShellSidebarSlot } from "@/app/layouts/admin-shell-context";
import {
  getBrowserQueryPage,
  getProjectEditorNavItems,
} from "@/shared/ui/sidebar-component";

export function useProjectEditorShellSidebar({
  suspended,
  activeSidebarTab,
  onSidebarSectionChange,
  userEmail,
  projectType,
  hasMasterplan,
  onSignOut,
  isSigningOut,
  isNavLoading,
}: {
  suspended: boolean;
  activeSidebarTab: string;
  onSidebarSectionChange: (section: string) => void;
  userEmail: string;
  projectType?: "building" | "object" | null;
  hasMasterplan?: boolean;
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  isNavLoading?: boolean;
}): AdminShellSidebarSlot | null {
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState(
    () => activeSidebarTab || getBrowserQueryPage() || "general",
  );

  const handleSectionChange = useCallback(
    (section: string) => {
      setActiveSection(section);
      onSidebarSectionChange(section);
    },
    [onSidebarSectionChange],
  );

  useEffect(() => {
    setActiveSection(activeSidebarTab || getBrowserQueryPage() || "general");
  }, [activeSidebarTab]);

  useEffect(() => {
    const handlePopState = () => {
      const next = getBrowserQueryPage() || "general";
      setActiveSection(next);
      onSidebarSectionChange(next);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onSidebarSectionChange]);

  const navItems = useMemo(
    () => getProjectEditorNavItems(t, projectType, hasMasterplan),
    [t, projectType, hasMasterplan],
  );

  return useMemo(() => {
    if (suspended) return null;

    return {
      kind: "project-editor",
      navItems,
      activeSection,
      onSectionChange: handleSectionChange,
      userEmail,
      title: t("projectEditorSidebar.title"),
      showSupportButton: false,
      ...(onSignOut ? { onSignOut } : {}),
      isSigningOut: isSigningOut ?? false,
      isNavLoading,
    };
  }, [
    activeSection,
    handleSectionChange,
    isNavLoading,
    isSigningOut,
    navItems,
    onSignOut,
    suspended,
    t,
    userEmail,
  ]);
}
