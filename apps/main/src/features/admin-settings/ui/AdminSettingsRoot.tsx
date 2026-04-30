import { Button, Skeleton } from "@gridix/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
} from "@gridix/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import {
  Save,
  User,
  Building,
  CreditCard,
  KeyRound,
  Bell,
  MessageSquare,
  Database,
} from "lucide-react";
import { LanguageToggle } from "@gridix/ui";
import {
  GlobalAccountProfileSection,
  GlobalAccountSecuritySection,
  GlobalNotificationSettingsSection,
} from "@gridix/utils/react";
import { ADMIN_THEME } from "@gridix/utils/lib";
import { type User as SupabaseUser } from "@supabase/supabase-js";

import type { ManagerRole } from "@/hooks/useUserRole";
import { useAdminSettingsController } from "../model";
import { AdminSettingsBillingTab } from "./AdminSettingsBillingTab";
import { AdminSettingsCompanyTab } from "./AdminSettingsCompanyTab";
import { AdminSettingsContactsTab } from "./AdminSettingsContactsTab";
import { AdminSettingsDataTab } from "./AdminSettingsDataTab";

type AdminSettingsRootProps = {
  userProfile: SupabaseUser;
  loading: boolean;
  developerId?: string;
  isManager?: boolean;
  managerData?: ManagerRole[];
};

export const AdminSettingsRoot = ({
  userProfile,
  loading,
  developerId,
  managerData,
}: AdminSettingsRootProps) => {
  const {
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
  } = useAdminSettingsController({
    userProfile,
    loading,
    developerId,
    managerData,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28 max-sm:hidden" />
          <Skeleton className="h-9 w-28 max-md:hidden" />
        </div>
        <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 shadow-sm sm:p-6">
          <Skeleton className="mb-2 h-5 w-40" />
          <Skeleton className="mb-6 h-4 w-64 max-w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(v) => setTab(v as never)}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="shrink-0 space-y-4 bg-background">
        <PageHeader
          title={t("adminSettings.title")}
          description={t("adminSettings.description")}
          actions={
            <>
              <LanguageToggle />
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[var(--admin-primary)] text-[var(--admin-text-on-primary)] hover:bg-[var(--admin-primary-hover)]"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? t("adminSettings.saving") : t("adminSettings.save")}
              </Button>
            </>
          }
        />

        <TabsList>
          <div className="w-full sm:hidden">
            <Select value={tab} onValueChange={(v) => setTab(v as never)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder={t("adminSettings.company")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="company">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {t("adminSettings.company")}
                  </div>
                </SelectItem>

                <SelectItem value="billing">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t("adminSettings.billing")}
                  </div>
                </SelectItem>

                <SelectItem value="account">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    {t("adminSettings.account")}
                  </div>
                </SelectItem>

                <SelectItem value="contacts">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("adminSettings.contacts")}
                  </div>
                </SelectItem>

                <SelectItem value="notifications">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {t("adminSettings.notifications")}
                  </div>
                </SelectItem>

                <SelectItem value="templates">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t("adminSettings.templates")}
                  </div>
                </SelectItem>

                <SelectItem value="data">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {t("adminSettings.data")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="hidden flex-wrap gap-3 sm:flex">
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              {t("adminSettings.company")}
            </TabsTrigger>

            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {t("adminSettings.billing")}
            </TabsTrigger>

            <TabsTrigger value="account" className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              {t("adminSettings.account")}
            </TabsTrigger>

            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("adminSettings.contacts")}
            </TabsTrigger>

            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              {t("adminSettings.notifications")}
            </TabsTrigger>

            {/*      <TabsTrigger value="templates" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {t("adminSettings.templates")}
            </TabsTrigger> */}

            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t("adminSettings.data")}
            </TabsTrigger>
          </div>
        </TabsList>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pt-6">
        <TabsContent value="company">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>{t("adminSettings.companyInfo")}</CardTitle>
              <CardDescription>
                {t("adminSettings.companyInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <AdminSettingsCompanyTab
                settingsCompanyName={companySettings.company_name || ""}
                onBrandNameChange={(value) =>
                  handleCompanyInputChange("company_name", value)
                }
                companySettings={companySettings}
                onCompanyFieldChange={handleCompanyInputChange}
                systemDomain={getSystemDomain()}
                logoInputRef={logoInputRef}
                uploadingLogo={uploadingLogo}
                onLogoFileChange={handleLogoFileChange}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>{t("adminSettings.billingInfo")}</CardTitle>
              <CardDescription>
                {t("adminSettings.billingInfoDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
              <AdminSettingsBillingTab
                companySettings={companySettings}
                onCompanyFieldChange={handleCompanyInputChange}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <div className="space-y-6">
            <GlobalAccountProfileSection
              userId={userProfile?.id}
              onReady={onProfileReady}
            />
            <GlobalAccountSecuritySection
              userEmail={userProfile?.email || ""}
              primaryColor={ADMIN_THEME.primary}
              primaryHoverColor={ADMIN_THEME.primaryHover}
              textOnPrimaryColor={ADMIN_THEME.textOnPrimary}
            />
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <AdminSettingsContactsTab
            isManagerMode={isManagerMode}
            developerId={developerId}
            userProfileId={userProfile?.id}
            managerData={managerData}
          />
        </TabsContent>

        <TabsContent value="notifications">
          <GlobalNotificationSettingsSection
            userId={userProfile?.id}
            userEmail={userProfile?.email || ""}
            onReady={onNotificationReady}
          />
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle>{t("adminSettings.dataManagement")}</CardTitle>
              <CardDescription>
                {t("adminSettings.dataManagementDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              <AdminSettingsDataTab
                exportingBackup={exportingBackup}
                resettingSettings={resettingSettings}
                onExportBackup={handleExportBackup}
                onResetSettings={handleResetSettings}
                t={t}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
};
