import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@gridix/utils/react";

import type { AdminShellSidebarSlot } from "@/app/layouts/admin-shell-context";
import { getSubProjectEditorNavItems } from "@/shared/ui/sidebar-component";

export function useSubProjectEditorShellSidebar({
  activeTab,
  onSidebarSectionChange,
  userEmail,
  subProjectType,
}: {
  activeTab: string;
  onSidebarSectionChange: (section: string) => void;
  userEmail: string;
  subProjectType?: "building" | "object" | null;
}): AdminShellSidebarSlot {
  const { t } = useLanguage();

  const [activeSection, setActiveSection] = useState(
    () => activeTab || "general",
  );

  const handleSectionChange = useCallback(
    (section: string) => {
      setActiveSection(section);
      onSidebarSectionChange(section);
    },
    [onSidebarSectionChange],
  );

  useEffect(() => {
    setActiveSection(activeTab || "general");
  }, [activeTab]);

  const navItems = useMemo(
    () => getSubProjectEditorNavItems(t, subProjectType),
    [subProjectType, t],
  );

  return useMemo(
    () => ({
      kind: "subproject-editor",
      navItems,
      activeSection,
      onSectionChange: handleSectionChange,
      userEmail,
      title: t("projectEditorSidebar.title"),
      showSupportButton: false,
      syncQueryParam: false,
    }),
    [activeSection, handleSectionChange, navItems, t, userEmail],
  );
}
