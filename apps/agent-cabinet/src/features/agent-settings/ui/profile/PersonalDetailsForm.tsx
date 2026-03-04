import { Input, Label } from "@gridix/ui";
import { MapPin, Phone, User } from "lucide-react";
import type { UserProfileRow } from "@/entities/agent-profile";

type Props = {
  personType: "company" | "individual";
  value: Partial<UserProfileRow>;
  onChange: (next: Partial<UserProfileRow>) => void;
  t: (key: string) => string;
};

export function PersonalDetailsForm({ personType, value, onChange, t }: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--admin-border-light)] bg-[var(--admin-background-secondary)] p-4 md:p-6">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--admin-text-primary)]">
        <User size={16} className="text-[var(--admin-primary)]" />
        {t("adminSettings.contractPersonalDetails")}
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="full_name"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("adminSettings.fullName")}
          </Label>
          <Input
            id="full_name"
            value={value.full_name ?? ""}
            onChange={(e) => onChange({ ...value, full_name: e.target.value })}
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>

        {personType === "company" && (
          <div className="space-y-2">
            <Label
              htmlFor="company_name"
              className="text-xs font-bold text-[var(--admin-text-secondary)]"
            >
              {t("adminSettings.companyName")}
            </Label>
            <Input
              id="company_name"
              value={value.company_name ?? ""}
              onChange={(e) =>
                onChange({ ...value, company_name: e.target.value })
              }
              className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            <span className="flex items-center gap-1">
              <Phone size={12} /> {t("adminSettings.phone")}
            </span>
          </Label>
          <Input
            id="phone"
            value={value.phone ?? ""}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="tax_id"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("adminSettings.taxId")}
          </Label>
          <Input
            id="tax_id"
            value={value.tax_id ?? ""}
            onChange={(e) => onChange({ ...value, tax_id: e.target.value })}
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="legal_address"
          className="text-xs font-bold text-[var(--admin-text-secondary)]"
        >
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {t("adminSettings.companyAddress")}
          </span>
        </Label>
        <Input
          id="legal_address"
          value={value.legal_address ?? ""}
          onChange={(e) =>
            onChange({ ...value, legal_address: e.target.value })
          }
          className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
        />
      </div>
    </div>
  );
}
