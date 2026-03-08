import { Button, Input, Label } from "@gridix/ui";
import { Plus } from "lucide-react";
import type { DnsProvider } from "../model/types";
import { useLanguage } from "@/contexts/LanguageContext";

interface DomainAddFormProps {
  newDomain: string;
  onNewDomainChange: (value: string) => void;
  onAddDomain: () => Promise<void>;
  isAddingDomain: boolean;
  dnsProvider: DnsProvider;
  onDnsProviderChange: (value: DnsProvider) => void;
  dnsApiKey: string;
  onDnsApiKeyChange: (value: string) => void;
  dnsZoneId: string;
  onDnsZoneIdChange: (value: string) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

export function DomainAddForm({
  newDomain,
  onNewDomainChange,
  onAddDomain,
  isAddingDomain,
  dnsProvider,
  onDnsProviderChange,
  dnsApiKey,
  onDnsApiKeyChange,
  dnsZoneId,
  onDnsZoneIdChange,
  showAdvanced,
  onToggleAdvanced,
}: DomainAddFormProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <Label htmlFor="new-domain">{t("domains.addNew")}</Label>
      <div className="flex flex-col gap-2 xs:flex-row">
        <Input
          id="new-domain"
          placeholder={t("domains.placeholder")}
          value={newDomain}
          onChange={(e) => onNewDomainChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void onAddDomain()}
        />
        <Button
          onClick={() => void onAddDomain()}
          disabled={!newDomain.trim() || isAddingDomain}
          className="shrink-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          {isAddingDomain ? t("domains.adding") : t("domains.addButton")}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{t("domains.inputHelp")}</p>

      <div className="border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleAdvanced}
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
                  onDnsProviderChange(e.target.value as DnsProvider)
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
                    onChange={(e) => onDnsApiKeyChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zone-id">Zone ID</Label>
                  <Input
                    id="zone-id"
                    placeholder="Your Cloudflare Zone ID"
                    value={dnsZoneId}
                    onChange={(e) => onDnsZoneIdChange(e.target.value)}
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
  );
}
