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
  Badge,
  Button,
  Label,
  Switch,
} from "@gridix/ui";
import { CheckCircle, ExternalLink, Globe, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DNSRecord, ProjectDomain } from "../model/types";
import { DomainDnsInstructions } from "./DomainDnsInstructions";

interface DomainListProps {
  domains: ProjectDomain[];
  dnsInstructions: Record<string, DNSRecord[]>;
  onCheckStatus: (
    domain: Pick<ProjectDomain, "domain" | "id">,
  ) => Promise<void>;
  onDeleteDomain: (domainId: string) => Promise<void>;
  onTogglePrimary: (domainId: string, isPrimary: boolean) => Promise<void>;
  onCopyValue: (value: string) => void;
}

export function DomainList({
  domains,
  dnsInstructions,
  onCheckStatus,
  onDeleteDomain,
  onTogglePrimary,
  onCopyValue,
}: DomainListProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-3">
      {domains.map((domain) => {
        const domainInstructions = dnsInstructions[domain.domain] || [];
        const hasInstructions = domainInstructions.length > 0;

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
                        domain.status === "active" ? "default" : "secondary"
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
                  <Label htmlFor={`primary-${domain.id}`} className="text-sm">
                    {t("domains.setPrimary")}
                  </Label>
                  <Switch
                    id={`primary-${domain.id}`}
                    checked={domain.is_primary}
                    onCheckedChange={(checked) =>
                      void onTogglePrimary(domain.id, checked)
                    }
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void onCheckStatus(domain)}
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
                        onClick={() => void onDeleteDomain(domain.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t("domains.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {domain.status !== "active" && (
              <DomainDnsInstructions
                domainName={domain.domain}
                records={domainInstructions}
                hasInstructions={hasInstructions}
                onCopyValue={onCopyValue}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
