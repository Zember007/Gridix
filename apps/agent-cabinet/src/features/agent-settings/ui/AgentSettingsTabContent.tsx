import {
  GlobalAccountSecuritySection,
  GlobalNotificationSettingsSection,
} from "@gridix/utils/react";
import { Tabs, TabsContent } from "@gridix/ui";
import { Save } from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/shared/lib/language";
import {
  AgentSettingsTabs,
  AgentUserProfileSection,
  type SettingsTabValue,
  useAgentSettingsTabModel,
} from "@/features/agent-settings";
import { AgentSettingsDataTabPanel } from "./AgentSettingsDataTabPanel";

export function AgentSettingsTabContent() {
  const { t } = useLanguage();
  const translate = (key: string) => String(t(key));
  const {
    activeWorkspaceId,
    contractData,
    contractError,
    contractLoading,
    contractsQuery,
    handleSaveAll,
    handleSaveProfile,
    myProfileQuery,
    onNotificationReady,
    profileForm,
    profileLoading,
    refreshContracts,
    refreshProfile,
    saving,
    setProfileForm,
    setTab,
    tab,
    themeVariables,
    userEmail,
    userId,
  } = useAgentSettingsTabModel(translate);

  const profileSignaturePath = myProfileQuery.data?.signature_path ?? null;
  const profileSignatureMethod = myProfileQuery.data?.signature_method ?? null;
  const saveAllLabel = saving
    ? t("common.settings.savingProfile")
    : t("common.settings.saveAll");

  return (
    <div style={themeVariables}>
      <ModuleHeader
        title={t("common.settings.title")}
        subtitle={t("common.settings.subtitle")}
        hideSearch
        primaryAction={{
          label: saveAllLabel,
          icon: <Save size={18} />,
          onClick: () => void handleSaveAll(),
        }}
      />

      <div className="p-4 md:p-6">
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as SettingsTabValue)}
          className="space-y-6"
        >
          <AgentSettingsTabs tab={tab} onTabChange={setTab} t={translate} />

          <TabsContent value="company" className="space-y-6">
            <AgentUserProfileSection
              loading={profileLoading}
              value={profileForm}
              onChange={setProfileForm}
              onSave={handleSaveProfile}
              t={translate}
            />
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <GlobalAccountSecuritySection userEmail={userEmail} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <GlobalNotificationSettingsSection
              userId={userId ?? undefined}
              userEmail={userEmail}
              onReady={onNotificationReady}
            />
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <AgentSettingsDataTabPanel
              activeWorkspaceId={activeWorkspaceId}
              contractData={contractData ?? null}
              contractError={contractError}
              contractLoading={contractLoading}
              contracts={contractsQuery.data ?? []}
              contractsError={contractsQuery.error as Error | null}
              contractsLoading={contractsQuery.isLoading}
              profileSignatureMethod={profileSignatureMethod}
              profileSignaturePath={profileSignaturePath}
              refreshContracts={refreshContracts}
              refreshProfile={refreshProfile}
              t={translate}
              userId={userId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
