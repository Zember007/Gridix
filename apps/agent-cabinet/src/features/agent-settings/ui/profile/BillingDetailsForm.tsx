import { Input, Label, Switch } from "@gridix/ui";
import { CreditCard } from "lucide-react";
import type { UserProfileRow } from "@/entities/agent-profile";

type Props = {
  value: Partial<UserProfileRow>;
  onChange: (next: Partial<UserProfileRow>) => void;
  t: (key: string) => string;
};

export function BillingDetailsForm({ value, onChange, t }: Props) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--admin-border-light)] bg-[var(--admin-background-secondary)] p-4 md:p-6">
      <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--admin-text-primary)]">
        <CreditCard size={16} className="text-[var(--admin-primary)]" />
        {t("adminSettings.bankBillingDetails")}
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="bank_name"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("adminSettings.bankName")}
          </Label>
          <Input
            id="bank_name"
            value={value.bank_name ?? ""}
            onChange={(e) => onChange({ ...value, bank_name: e.target.value })}
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="iban"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("adminSettings.iban")}
          </Label>
          <Input
            id="iban"
            value={value.iban ?? ""}
            onChange={(e) => onChange({ ...value, iban: e.target.value })}
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label
            htmlFor="billing_currency"
            className="text-xs font-bold text-[var(--admin-text-secondary)]"
          >
            {t("adminSettings.billingCurrency")}
          </Label>
          <Input
            id="billing_currency"
            value={value.billing_currency ?? ""}
            onChange={(e) =>
              onChange({ ...value, billing_currency: e.target.value })
            }
            placeholder={t("adminSettings.billingCurrencyPlaceholder")}
            className="rounded-xl border-[var(--admin-border)] ring-offset-transparent focus-visible:ring-[var(--admin-primary)]"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card-background)] p-4">
          <div>
            <div className="text-sm font-bold text-[var(--admin-text-primary)]">
              {t("adminSettings.vatPayer")}
            </div>
            <div className="text-[10px] font-bold uppercase text-[var(--admin-text-muted)]">
              {t("adminSettings.billingInfoDesc")}
            </div>
          </div>
          <Switch
            checked={Boolean(value.is_vat_payer)}
            onCheckedChange={(checked) =>
              onChange({ ...value, is_vat_payer: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
