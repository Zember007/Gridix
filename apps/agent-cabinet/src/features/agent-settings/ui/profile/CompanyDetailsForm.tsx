import { Input, Label } from "@gridix/ui";
import type { UserProfileRow } from "@/entities/agent-profile";

type Props = {
  personType: "company" | "individual";
  value: Partial<UserProfileRow>;
  onChange: (next: Partial<UserProfileRow>) => void;
  t: (key: string) => string;
};

export function CompanyDetailsForm({ personType, value, onChange, t }: Props) {
  if (personType !== "company") return null;

  return (
    <div className="duration-300 animate-in fade-in slide-in-from-top-2">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="company_type"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("common.settings.agentCompanyType")}
          </Label>
          <Input
            id="company_type"
            value={value.company_type ?? ""}
            onChange={(e) =>
              onChange({ ...value, company_type: e.target.value })
            }
            placeholder={t("adminSettings.companyTypePlaceholder")}
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="registered_office"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("common.settings.agentRegisteredOffice")}
          </Label>
          <Input
            id="registered_office"
            value={value.registered_office ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                registered_office: e.target.value,
              })
            }
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="rep_name"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("common.settings.agentRepresentativeName")}
          </Label>
          <Input
            id="rep_name"
            value={value.representative_name ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                representative_name: e.target.value,
              })
            }
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="rep_title"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("common.settings.agentRepresentativeTitle")}
          </Label>
          <Input
            id="rep_title"
            value={value.representative_title ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                representative_title: e.target.value,
              })
            }
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
      </div>
    </div>
  );
}
