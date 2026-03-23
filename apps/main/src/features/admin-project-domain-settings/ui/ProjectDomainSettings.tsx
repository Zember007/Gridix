import {
  Alert,
  AlertDescription,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Separator,
} from "@gridix/ui";
import { AlertCircle, Globe, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProjectDomainSettings } from "../model/useProjectDomainSettings";
import { DomainAddForm } from "./DomainAddForm";
import { DomainList } from "./DomainList";
import { LoadingProgress } from "@/shared/ui/LoadingProgress";
import { useAdminAccess } from "@/entities/admin-access";
import { AdminAccessNotice } from "@/shared/ui/AdminAccessNotice";

interface ProjectDomainSettingsProps {
  projectId: string;
  projectName: string;
}

export function ProjectDomainSettings({
  projectId,
  projectName,
}: ProjectDomainSettingsProps) {
  const { t } = useLanguage();
  const adminAccess = useAdminAccess();
  const {
    domains,
    loading,
    isWaitingForEditorData,
    newDomain,
    setNewDomain,
    isAddingDomain,
    dnsProvider,
    setDnsProvider,
    dnsApiKey,
    setDnsApiKey,
    dnsZoneId,
    setDnsZoneId,
    showAdvanced,
    setShowAdvanced,
    dnsInstructions,
    copyToClipboard,
    handleAddDomain,
    handleDeleteDomain,
    handleCheckDomainStatus,
    handleTogglePrimary,
  } = useProjectDomainSettings({ projectId });

  if (!(adminAccess?.canUseCustomDomain(projectId) ?? false)) {
    return <AdminAccessNotice variant="pro" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t("domains.title")}
        </CardTitle>
        <CardDescription>
          {t("domains.description", { projectName })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="space-y-3">
            <div className="font-medium">{t("domains.instructions.title")}</div>
            <div className="space-y-2 text-sm">
              <div>
                <strong>1.</strong> {t("domains.instructions.step1")}
              </div>
              <div>
                <strong>2.</strong> {t("domains.instructions.step2")}
              </div>
              <div>
                <strong>3.</strong> {t("domains.instructions.step3")}
              </div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              💡 DNS инструкции для каждого домена отображаются ниже в списке
              подключенных доменов
            </div>
          </AlertDescription>
        </Alert>

        <Separator />

        <DomainAddForm
          newDomain={newDomain}
          onNewDomainChange={setNewDomain}
          onAddDomain={handleAddDomain}
          isAddingDomain={isAddingDomain}
          dnsProvider={dnsProvider}
          onDnsProviderChange={setDnsProvider}
          dnsApiKey={dnsApiKey}
          onDnsApiKeyChange={setDnsApiKey}
          dnsZoneId={dnsZoneId}
          onDnsZoneIdChange={setDnsZoneId}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
        />

        <Separator />

        <div className="space-y-4">
          <Label>{t("domains.connectedDomains")}</Label>

          {isWaitingForEditorData || loading ? (
            <div className="flex min-h-32 items-center justify-center py-4">
              <LoadingProgress />
            </div>
          ) : domains.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Globe className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>{t("domains.noDomains")}</p>
              <p className="text-sm">{t("domains.addFirst")}</p>
            </div>
          ) : (
            <DomainList
              domains={domains}
              dnsInstructions={dnsInstructions}
              onCheckStatus={handleCheckDomainStatus}
              onDeleteDomain={handleDeleteDomain}
              onTogglePrimary={handleTogglePrimary}
              onCopyValue={copyToClipboard}
            />
          )}
        </div>

        {domains.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t("domains.warning")}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
