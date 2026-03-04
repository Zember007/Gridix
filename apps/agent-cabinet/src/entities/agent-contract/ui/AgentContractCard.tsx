import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import type { AgentApplicationSettings } from "../model/types";

interface AgentContractCardProps {
  data: AgentApplicationSettings | null;
  loading: boolean;
  error: Error | null;
  t: (key: string) => string;
}

export function AgentContractCard({
  data,
  loading,
  error,
  t,
}: AgentContractCardProps) {
  const formatValue = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (value instanceof Date) return value.toISOString();
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--admin-primary)] border-t-transparent" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-[var(--admin-error)]">
          {t("common.settings.loadError")}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const fields: Array<{ label: string; value: unknown }> = [
    { label: t("common.settings.fullName"), value: data.full_name },
    { label: t("common.settings.companyName"), value: data.company_name },
    { label: t("common.settings.type"), value: data.type },
    { label: t("common.settings.taxId"), value: data.tax_id },
    { label: t("common.settings.legalAddress"), value: data.legal_address },
    { label: t("common.settings.phone"), value: data.phone },
    {
      label: t("common.settings.agentCompanyType"),
      value: data.agent_company_type,
    },
    {
      label: t("common.settings.agentRegisteredOffice"),
      value: data.agent_registered_office,
    },
    {
      label: t("common.settings.agentRepresentativeName"),
      value: data.agent_representative_name,
    },
    {
      label: t("common.settings.agentRepresentativeTitle"),
      value: data.agent_representative_title,
    },
    { label: t("common.settings.status"), value: data.status },
    {
      label: t("common.settings.agreementSignedAt"),
      value: data.agreement_signed_at,
    },
    { label: t("common.settings.commissionRate"), value: data.commission_rate },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("common.settings.contractTitle")}</CardTitle>
        <CardDescription>{t("common.settings.contractDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.label}>
              <dt className="text-sm font-medium text-[var(--admin-text-muted)]">
                {f.label}
              </dt>
              <dd className="mt-1 text-sm text-[var(--admin-text-primary)]">
                {formatValue(f.value) ?? "\u2014"}
              </dd>
            </div>
          ))}
        </div>

        {data.bank_details !== null && data.bank_details !== undefined && (
          <div className="mt-6">
            <dt className="text-sm font-medium text-[var(--admin-text-muted)]">
              {t("common.settings.bankDetails")}
            </dt>
            <dd className="mt-1 whitespace-pre-wrap rounded-md bg-[var(--admin-background-secondary)] p-3 text-sm text-[var(--admin-text-primary)]">
              {formatValue(data.bank_details) ?? "\u2014"}
            </dd>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
