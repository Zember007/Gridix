import {
  GlobalAccountSecuritySection,
  GlobalNotificationSettingsSection,
} from "@gridix/utils/react";
import { Tabs, TabsContent } from "@gridix/ui";
import { Save } from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/shared/lib/language";
import type { SettingsSectionValue } from "@/features/agent-settings/model/types";
import { AgentSettingsSectionsSwitcher } from "@/features/agent-settings/ui/sections/AgentSettingsSectionsSwitcher";
import { AgentUserProfileSection } from "@/features/agent-settings/ui/sections/AgentUserProfileSection";
import { AgentSettingsDataSection } from "@/widgets/agent-settings-data";
import { useAgentSettingsTabModel } from "./model/useAgentSettingsTabModel";

export function AgentSettingsTab() {
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
    section,
    setProfileForm,
    setSection,
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
          value={section}
          onValueChange={(value) => setSection(value as SettingsSectionValue)}
          className="space-y-6"
        >
          <AgentSettingsSectionsSwitcher
            activeSection={section}
            onSectionChange={setSection}
            t={translate}
          />

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
            <AgentSettingsDataSection
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
