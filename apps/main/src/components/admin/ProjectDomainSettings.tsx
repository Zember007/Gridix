import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Button } from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Badge } from "@gridix/ui";
import { Separator } from "@gridix/ui";
import {
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Info,
  Copy,
  CheckCircle,
} from "lucide-react";
import { useProjectDomains } from "@/entities/project/queries/useProjectDomains";
import { useProjectEditorDataContext } from "@/features/projectEditor/context/ProjectEditorDataContext";
import { Alert, AlertDescription } from "@gridix/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";

interface ProjectDomainSettingsProps {
  projectId: string;
  projectName: string;
}

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  description: string;
}

export default function ProjectDomainSettings({
  projectId,
  projectName,
}: ProjectDomainSettingsProps) {
  const editorData = useProjectEditorDataContext();
  const isEditorContext = Boolean(editorData);
  const isWaitingForEditorData = Boolean(editorData?.loading);
  const initialDomains =
    editorData?.data?.domains != null && Array.isArray(editorData.data.domains)
      ? editorData.data.domains
      : null;
  const projectIdForDomains = isEditorContext
    ? editorData?.data
      ? projectId
      : undefined
    : projectId;
  const { domains, loading, updateDomain } = useProjectDomains(
    projectIdForDomains,
    initialDomains,
  );
  const [newDomain, setNewDomain] = useState("");
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [dnsProvider, setDnsProvider] = useState<"manual" | "cloudflare">(
    "manual",
  );
  const [dnsApiKey, setDnsApiKey] = useState("");
  const [dnsZoneId, setDnsZoneId] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dnsInstructions, setDnsInstructions] = useState<
    Record<string, DNSRecord[]>
  >({});
  const { t } = useLanguage();

  // Автоматически загружать DNS инструкции для всех доменов при загрузке
  useEffect(() => {
    const loadDnsInstructions = async () => {
      if (!domains || domains.length === 0) return;

      for (const domain of domains) {
        if (domain.status === "active") continue; // Skip DNS fetch for already active domains
        try {
          const { data: result, error } = await supabase.functions.invoke(
            "auto-domain-manager",
            {
              body: {
                action: "status",
                domain: domain.domain,
                project_id: projectId,
              },
            },
          );

          if (
            !error &&
            result?.success &&
            result.automation?.instructions?.dns_records
          ) {
            setDnsInstructions((prev) => ({
              ...prev,
              [domain.domain]: result.automation.instructions.dns_records,
            }));
          }
        } catch (error) {
          console.error(
            `Failed to load DNS instructions for ${domain.domain}:`,
            error,
          );
        }
      }
    };

    if (!loading && domains.length > 0) {
      loadDnsInstructions();
    }
  }, [domains, loading, projectId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("domains.copyValue"));
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) {
      toast.warning("⚠️ Please enter a domain name");
      return;
    }

    setIsAddingDomain(true);

    try {
      // Prepare request body - only include DNS provider credentials if Cloudflare is selected
      const requestBody: {
        domain: string;
        project_id: string;
        dns_provider?: "cloudflare" | "godaddy" | "namecheap";
        api_key?: string;
        zone_id?: string;
      } = {
        domain: newDomain.trim(),
        project_id: projectId,
      };

      // Only include DNS provider info if Cloudflare is selected and credentials are provided
      if (dnsProvider === "cloudflare" && dnsApiKey && dnsZoneId) {
        requestBody.dns_provider = "cloudflare";
        requestBody.api_key = dnsApiKey;
        requestBody.zone_id = dnsZoneId;
      }

      // Directly call the Edge Function via Supabase client
      const { data: result, error } = await supabase.functions.invoke(
        "auto-domain-manager",
        {
          body: requestBody,
        },
      );

      if (error) {
        console.error("Supabase function error:", error);

        // Provide user-friendly error messages based on error type
        if (error.message?.includes("fetch")) {
          toast.error("❌ Network error: Could not connect to server");
        } else if (error.message?.includes("unauthorized")) {
          toast.error("❌ Authorization error: Please check your credentials");
        } else {
          toast.error(`❌ Error: ${error.message || "Unknown error occurred"}`);
        }

        setIsAddingDomain(false);
        return;
      }

      if (result?.success) {
        // Show main success message
        toast.success(result.message || "✅ Domain added successfully!");

        // Save DNS instructions from the response
        if (result.automation?.instructions?.dns_records) {
          setDnsInstructions((prev) => ({
            ...prev,
            [result.domain]: result.automation.instructions.dns_records,
          }));
        }

        setNewDomain("");
        setDnsApiKey("");
        setDnsZoneId("");

        // Show detailed automation results
        if (result.details) {
          const details = result.details;

          if (details.dns_configured) {
            toast.success("✅ DNS records created automatically");
          }
          if (details.hosting_configured) {
            toast.success("✅ Hosting configured automatically");
          }
          if (details.ssl_ready) {
            toast.success("✅ SSL certificate ready");
          }
          if (details.requires_manual_setup) {
            toast.warning("⚠️ Manual setup required - see instructions below", {
              duration: 6000,
            });
          }
        }

        // Show automation status summary
        if (result.automation) {
          const automationMessages = [];
          if (result.automation.dns_created) {
            automationMessages.push("DNS ✓");
          }
          if (result.automation.hosting_added) {
            automationMessages.push("Hosting ✓");
          }
          if (result.automation.ssl_ready) {
            automationMessages.push("SSL ✓");
          }

          if (automationMessages.length > 0) {
            toast.info(`🚀 Automation: ${automationMessages.join(", ")}`, {
              duration: 5000,
            });
          }
        }

        // Refresh domains list
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.set("page", "domains");
          window.location.href = url.toString();
        }, 1500);
      } else {
        // Handle error response from the function
        const errorMessage =
          result?.error || result?.message || "Failed to add domain";

        // Provide context-specific error messages
        if (errorMessage.includes("already exists")) {
          toast.error("❌ This domain is already registered");
        } else if (errorMessage.includes("Invalid domain")) {
          toast.error("❌ Invalid domain format. Please check and try again.");
        } else if (errorMessage.includes("DNS")) {
          toast.error(`❌ DNS Error: ${errorMessage}`);
        } else if (
          errorMessage.includes("webhook") ||
          errorMessage.includes("404")
        ) {
          toast.error(
            "❌ Server configuration error. Please contact administrator.",
            {
              description: "Webhook endpoint not found",
              duration: 6000,
            },
          );
        } else if (
          errorMessage.includes("SSL") ||
          errorMessage.includes("certificate")
        ) {
          toast.error("❌ SSL configuration failed", {
            description: errorMessage,
            duration: 6000,
          });
        } else {
          toast.error(`❌ ${errorMessage}`);
        }

        // Show additional error details if available
        if (result?.details) {
          console.error("Domain automation error details:", result.details);
        }
      }
    } catch (error) {
      console.error("Domain automation error:", error);

      // Extract meaningful error message
      let errorMessage = "An unexpected error occurred";
      let errorDescription = "";

      if (error && typeof error === "object") {
        if ("message" in error) {
          errorMessage = error.message as string;
        } else if ("error" in error) {
          errorMessage = (error as { error: string }).error;
        }

        // Provide user-friendly messages for common errors
        if (
          errorMessage.includes("Failed to fetch") ||
          errorMessage.includes("NetworkError")
        ) {
          errorMessage = "Network connection failed";
          errorDescription =
            "Please check your internet connection and try again";
        } else if (errorMessage.includes("timeout")) {
          errorMessage = "Request timed out";
          errorDescription =
            "The server took too long to respond. Please try again.";
        } else if (errorMessage.includes("CORS")) {
          errorMessage = "Configuration error";
          errorDescription = "Please contact administrator";
        }
      }

      toast.error(`❌ ${errorMessage}`, {
        description: errorDescription || undefined,
        duration: 6000,
      });

      // Log full error for debugging
      console.error("Full error object:", error);
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    try {
      const domain = domains.find((d) => d.id === domainId);
      if (!domain) {
        toast.error("Domain not found");
        return;
      }

      const { data: result, error } = await supabase.functions.invoke(
        "auto-domain-manager",
        {
          body: {
            action: "remove",
            domain: domain.domain,
            project_id: projectId,
            domain_id: domain.id,
          },
        },
      );

      if (error) {
        console.error("Remove function error:", error);
        toast.error(`❌ ${error.message || "Failed to remove domain"}`);
        return;
      }

      if (result?.success) {
        toast.success(
          `✅ ${result.message || `Domain ${domain.domain} removed`}`,
        );
        setTimeout(() => window.location.reload(), 1000);
      } else {
        const errorMessage = result?.error || "Failed to remove domain";
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error("Domain removal error:", error);
      toast.error("Failed to remove domain");
    }
  };

  const handleCheckDomainStatus = async (domain: {
    domain: string;
    id: string;
  }) => {
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "auto-domain-manager",
        {
          body: {
            action: "status",
            domain: domain.domain,
            project_id: projectId,
          },
        },
      );

      if (error) {
        console.error("Status function error:", error);
        toast.error(`❌ ${error.message || "Failed to check status"}`);
        return;
      }

      if (result?.success) {
        // Update DNS instructions if available in status response
        if (result.automation?.instructions?.dns_records) {
          setDnsInstructions((prev) => ({
            ...prev,
            [domain.domain]: result.automation.instructions.dns_records,
          }));
        }

        // Check if we have vercel status
        if (result.vercel) {
          const vercel = result.vercel;
          const verified = vercel.verified ? "✅ Verified" : "⚠️ Not verified";
          const configured = vercel.configured
            ? "✅ Configured"
            : "⚠️ Not configured";
          toast.success(`Domain Status: ${verified} | ${configured}`, {
            duration: 5000,
          });
        } else {
          // Fallback to old format if available
          const payload = result.status;
          if (payload) {
            const overall = payload?.overall_status || "Unknown";
            const nginxEnabled = payload?.nginx?.enabled === true;
            const sslValid = payload?.ssl?.certificate_valid === true;
            const nginxStatus = nginxEnabled ? "✅ Enabled" : "❌ Disabled";
            const sslStatus = sslValid ? "✅ Valid" : "❌ Invalid";
            const overallIcon = overall === "active" ? "✅" : "⚠️";
            toast.success(`${overallIcon} Domain Status: ${overall}`, {
              description: `Nginx: ${nginxStatus} | SSL: ${sslStatus}`,
              duration: 5000,
            });
          } else {
            toast.success("✅ Domain status checked", {
              description: "Domain is registered in the system",
              duration: 5000,
            });
          }
        }
      } else {
        const errorMessage = result?.error || "Failed to check status";
        toast.error(`❌ ${errorMessage}`);
      }
    } catch (error) {
      console.error("Status check error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast.error(`❌ Failed to check domain status: ${errorMessage}`);
    }
  };

  const handleTogglePrimary = async (domainId: string, isPrimary: boolean) => {
    if (isPrimary) {
      // First, set all other domains as non-primary
      for (const domain of domains) {
        if (domain.id !== domainId && domain.is_primary) {
          await updateDomain(domain.id, { is_primary: false });
        }
      }
    }

    await updateDomain(domainId, { is_primary: isPrimary });
  };

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
        {/* Instructions */}
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

        {/* Add new domain */}
        <div className="space-y-4">
          <Label htmlFor="new-domain">{t("domains.addNew")}</Label>
          <div className="flex flex-col gap-2 xs:flex-row">
            <Input
              id="new-domain"
              placeholder={t("domains.placeholder")}
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
            />
            <Button
              onClick={handleAddDomain}
              disabled={!newDomain.trim() || isAddingDomain}
              className="shrink-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isAddingDomain ? t("domains.adding") : t("domains.addButton")}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("domains.inputHelp")}
          </p>

          {/* DNS Automation Settings */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mb-3"
            >
              {showAdvanced ? "Hide" : "Show"} DNS Automation
            </Button>

            {showAdvanced && (
              <div className="space-y-4 rounded-lg bg-muted/50 p-4">
                <div className="space-y-2">
                  <Label>DNS Provider</Label>
                  <select
                    className="w-full rounded border p-2"
                    value={dnsProvider}
                    onChange={(e) =>
                      setDnsProvider(e.target.value as "manual" | "cloudflare")
                    }
                  >
                    <option value="manual">Manual Setup</option>
                    <option value="cloudflare">Cloudflare (Auto)</option>
                  </select>
                </div>

                {dnsProvider === "cloudflare" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="api-key">Cloudflare API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="Your Cloudflare API Key"
                        value={dnsApiKey}
                        onChange={(e) => setDnsApiKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zone-id">Zone ID</Label>
                      <Input
                        id="zone-id"
                        placeholder="Your Cloudflare Zone ID"
                        value={dnsZoneId}
                        onChange={(e) => setDnsZoneId(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      With API credentials, DNS records will be created
                      automatically.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Domains list */}
        <div className="space-y-4">
          <Label>{t("domains.connectedDomains")}</Label>

          {isWaitingForEditorData || loading ? (
            <div className="py-4 text-center text-muted-foreground">
              {t("project.loading")}
            </div>
          ) : domains.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Globe className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>{t("domains.noDomains")}</p>
              <p className="text-sm">{t("domains.addFirst")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => {
                const domainInstructions = dnsInstructions[domain.domain] || [];
                const hasInstructions = domainInstructions.length > 0;
                const recordsToShow = domainInstructions;

                return (
                  <div key={domain.id} className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{domain.domain}</span>
                            {domain.is_primary && (
                              <Badge variant="default" className="text-xs">
                                {t("domains.primary")}
                              </Badge>
                            )}
                            <Badge
                              variant={
                                domain.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {domain.status === "active"
                                ? t("domains.active")
                                : domain.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {t("domains.addedOn")}{" "}
                            {new Date(domain.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`primary-${domain.id}`}
                            className="text-sm"
                          >
                            {t("domains.setPrimary")}
                          </Label>
                          <Switch
                            id={`primary-${domain.id}`}
                            checked={domain.is_primary}
                            onCheckedChange={(checked) =>
                              handleTogglePrimary(domain.id, checked)
                            }
                          />
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckDomainStatus(domain)}
                          title="Check domain status"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(`https://${domain.domain}`, "_blank")
                          }
                          title="Open domain"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t("domains.deleteConfirm")}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("domains.deleteDescription", {
                                  domain: domain.domain,
                                })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t("domains.cancel")}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDomain(domain.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {t("domains.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* DNS Instructions for this domain */}
                    {domain.status !== "active" && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="space-y-3">
                          <div className="font-medium">
                            📋 DNS Records для {domain.domain}
                          </div>
                          <div className="mb-2 text-xs text-muted-foreground">
                            {hasInstructions
                              ? "Точные DNS записи получены от Vercel."
                              : "Показаны стандартные DNS записи Vercel. Нажмите кнопку проверки (✓), чтобы подтянуть статус/записи с сервера."}
                          </div>
                          <div className="space-y-3">
                            {recordsToShow.map((record, idx) => {
                              const displayName =
                                record.name === "@"
                                  ? domain.domain
                                  : `${record.name}.${domain.domain}`;
                              return (
                                <div
                                  key={idx}
                                  className="rounded-lg bg-muted p-3"
                                >
                                  <div className="mb-2 text-sm font-medium">
                                    {record.name === "@"
                                      ? t("domains.instructions.rootDomain")
                                      : t("domains.instructions.subdomain")}
                                  </div>
                                  <div className="grid grid-cols-3 gap-4 font-mono text-xs">
                                    <div>
                                      <div className="font-semibold text-foreground">
                                        {t("domains.dnsType")}
                                      </div>
                                      <div className="rounded border bg-background p-2">
                                        {record.type}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="font-semibold text-foreground">
                                        {t("domains.dnsName")}
                                      </div>
                                      <div className="rounded border bg-background p-2">
                                        {displayName}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 font-semibold text-foreground">
                                        {t("domains.dnsValue")}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() =>
                                            copyToClipboard(record.value)
                                          }
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <div className="rounded border bg-background p-2">
                                        {record.value}
                                      </div>
                                    </div>
                                  </div>
                                  {record.description && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                      {record.description}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="border-t pt-2 text-xs text-muted-foreground">
                            ⏱️ DNS изменения могут занять до 24 часов для
                            полного распространения
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Warning about DNS */}
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
