import { useEffect } from "react";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";

export const useAdminDashboardInit = (setActiveTab: (tab: string) => void) => {
  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    const queryParams = new URLSearchParams(window.location.search);
    const tab = queryParams.get("page");
    if (tab) {
      setActiveTab(tab);
    }
  }, [setActiveTab]);
};
