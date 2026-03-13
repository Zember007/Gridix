import { useEffect, useState } from "react";
import { useLanguage } from "@gridix/utils/react";
import { ADMIN_THEME, getAdminThemeVariables } from "@gridix/utils/lib";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAdminSettingsActions } from "./useAdminSettingsActions";
import { useAdminSettingsProfileCompany } from "./useAdminSettingsProfileCompany";
import type { AdminSettingsControllerProps, TabValue } from "./types";

export const useAdminSettingsController = ({
  userProfile,
}: AdminSettingsControllerProps) => {
  const { t } = useLanguage();
  const { isManagerMode } = useWorkspace();
  const [tab, setTab] = useState<TabValue>("company");

  useEffect(() => {
    const themeVariables = getAdminThemeVariables(ADMIN_THEME);
    Object.entries(themeVariables).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, []);
  const {
    companySettings,
    setCompanySettings,
    handleCompanyInputChange,
    getSystemDomain,
  } = useAdminSettingsProfileCompany(userProfile);
  const {
    uploadingLogo,
    logoInputRef,
    exportingBackup,
    resettingSettings,
    saving,
    onProfileReady,
    onNotificationReady,
    handleLogoFileChange,
    handleExportBackup,
    handleResetSettings,
    handleSave,
  } = useAdminSettingsActions({
    userProfile,
    t,
    companySettings,
    setCompanySettings,
    getSystemDomain,
  });

  return {
    t,
    isManagerMode,
    tab,
    setTab,
    companySettings,
    uploadingLogo,
    logoInputRef,
    exportingBackup,
    resettingSettings,
    saving,
    onProfileReady,
    onNotificationReady,
    handleCompanyInputChange,
    getSystemDomain,
    handleLogoFileChange,
    handleExportBackup,
    handleResetSettings,
    handleSave,
  };
};
