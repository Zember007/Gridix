import {
  GlobalAccountSecuritySection,
  GlobalNotificationSettingsSection,
} from "@gridix/utils/react";
import { Card, CardContent, Tabs, TabsContent } from "@gridix/ui";
import { Save } from "lucide-react";
import { ModuleHeader } from "@/shared/ui/ModuleHeader";
import { useLanguage } from "@/shared/lib/language";
import {
  AgentContractCard,
  AgentSettingsTabs,
  AgentSignatureSection,
  AgentSignedContractsSection,
  AgentUserProfileSection,
  type SettingsTabValue,
  useAgentSettingsTabModel,
} from "@/features/agent-settings";

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

  return (
    <div style={themeVariables}>
      <ModuleHeader
        title={t("common.settings.title")}
        subtitle={t("common.settings.subtitle")}
        hideSearch
        primaryAction={{
          label: saving
            ? t("common.settings.savingProfile")
            : t("common.settings.saveAll"),
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
            <AgentSignatureSection
              userId={userId}
              existingSignaturePath={
                myProfileQuery.data?.signature_path ?? null
              }
              existingMethod={myProfileQuery.data?.signature_method ?? null}
              onUpdated={refreshProfile}
              t={translate}
            />

            <AgentSignedContractsSection
              applicationId={activeWorkspaceId ?? null}
              loading={contractsQuery.isLoading}
              error={contractsQuery.error as Error | null}
              contracts={contractsQuery.data ?? []}
              onRefresh={refreshContracts}
              t={translate}
            />

            {activeWorkspaceId ? (
              <AgentContractCard
                data={contractData ?? null}
                loading={contractLoading}
                error={contractError}
                t={translate}
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center text-[var(--admin-text-muted)]">
                  <p className="text-base font-medium">
                    {t("common.workspace.noActiveTitle")}
                  </p>
                  <p className="mt-1 text-sm">
                    {t("common.workspace.pickInSidebar")}
                  </p>
                  <p className="mt-4 text-xs">
                    {t("common.settings.contractTitle")}{" "}
                    {t("common.settings.contractDesc").toLowerCase()}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
