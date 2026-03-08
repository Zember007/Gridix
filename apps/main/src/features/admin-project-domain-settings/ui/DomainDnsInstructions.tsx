import { Button, Alert, AlertDescription } from "@gridix/ui";
import { Copy, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { DNSRecord } from "../model/types";

interface DomainDnsInstructionsProps {
  domainName: string;
  records: DNSRecord[];
  hasInstructions: boolean;
  onCopyValue: (value: string) => void;
}

export function DomainDnsInstructions({
  domainName,
  records,
  hasInstructions,
  onCopyValue,
}: DomainDnsInstructionsProps) {
  const { t } = useLanguage();

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div className="font-medium">📋 DNS Records для {domainName}</div>
        <div className="mb-2 text-xs text-muted-foreground">
          {hasInstructions
            ? "Точные DNS записи получены от Vercel."
            : "Показаны стандартные DNS записи Vercel. Нажмите кнопку проверки (✓), чтобы подтянуть статус/записи с сервера."}
        </div>
        <div className="space-y-3">
          {records.map((record, idx) => {
            const displayName =
              record.name === "@" ? domainName : `${record.name}.${domainName}`;

            return (
              <div key={idx} className="rounded-lg bg-muted p-3">
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
                        onClick={() => onCopyValue(record.value)}
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
          ⏱️ DNS изменения могут занять до 24 часов для полного распространения
        </div>
      </AlertDescription>
    </Alert>
  );
}
