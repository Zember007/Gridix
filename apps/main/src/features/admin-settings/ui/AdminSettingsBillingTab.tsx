import {
  Checkbox,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@gridix/ui";
import type { Tables } from "@gridix/types/database";

type CompanySettings = Tables<"company_settings">;

type AdminSettingsBillingTabProps = {
  companySettings: CompanySettings;
  onCompanyFieldChange: (
    field: keyof CompanySettings,
    value: string | boolean | null,
  ) => void;
  onCompanyFieldCommit: () => void;
  t: (key: string, vars?: Record<string, unknown>) => string;
};

export const AdminSettingsBillingTab = ({
  companySettings,
  onCompanyFieldChange,
  onCompanyFieldCommit,
  t,
}: AdminSettingsBillingTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="company_name_billing">
            {t("adminSettings.companyName")}
          </Label>
          <Input
            id="company_name_billing"
            value={companySettings.company_name}
            onChange={(e) =>
              onCompanyFieldChange("company_name", e.target.value)
            }
            onBlur={onCompanyFieldCommit}
            placeholder={t("adminSettings.companyNamePlaceholder")}
          />
        </div>

        <div>
          <Label htmlFor="tax_id">{t("adminSettings.taxId")}</Label>
          <Input
            id="tax_id"
            value={companySettings.tax_id || ""}
            onChange={(e) =>
              onCompanyFieldChange("tax_id", e.target.value || null)
            }
            onBlur={onCompanyFieldCommit}
            placeholder={t("adminSettings.taxIdPlaceholder")}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">{t("adminSettings.companyAddress")}</Label>
        <Textarea
          id="address"
          value={companySettings.address || ""}
          onChange={(e) =>
            onCompanyFieldChange("address", e.target.value || null)
          }
          onBlur={onCompanyFieldCommit}
          placeholder={t("adminSettings.companyAddressPlaceholder")}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="phone">{t("adminSettings.phone")}</Label>
          <Input
            id="phone"
            value={companySettings.phone || ""}
            onChange={(e) =>
              onCompanyFieldChange("phone", e.target.value || null)
            }
            onBlur={onCompanyFieldCommit}
            placeholder={t("adminSettings.phonePlaceholder")}
          />
        </div>

        <div>
          <Label htmlFor="email">{t("adminSettings.email")}</Label>
          <Input
            id="email"
            type="email"
            value={companySettings.email || ""}
            onChange={(e) =>
              onCompanyFieldChange("email", e.target.value || null)
            }
            onBlur={onCompanyFieldCommit}
            placeholder={t("adminSettings.emailPlaceholder")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="bank_name">{t("adminSettings.bankName")}</Label>
          <Input
            id="bank_name"
            value={companySettings.bank_name || ""}
            onChange={(e) =>
              onCompanyFieldChange("bank_name", e.target.value || null)
            }
            onBlur={onCompanyFieldCommit}
            placeholder={t("adminSettings.bankNamePlaceholder")}
          />
        </div>

        <div>
          <Label htmlFor="iban">{t("adminSettings.iban")}</Label>
          <Input
            id="iban"
            value={companySettings.iban || ""}
            onChange={(e) =>
              onCompanyFieldChange("iban", e.target.value || null)
            }
            onBlur={onCompanyFieldCommit}
            placeholder={t("adminSettings.ibanPlaceholder")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="currency">{t("adminSettings.currency")}</Label>
          <Select
            value={companySettings.currency || "GEL"}
            onValueChange={(value) => {
              onCompanyFieldChange("currency", value);
              onCompanyFieldCommit();
            }}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t("adminSettings.currencyPlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GEL">GEL (Georgian Lari)</SelectItem>
              <SelectItem value="USD">USD (US Dollar)</SelectItem>
              <SelectItem value="EUR">EUR (Euro)</SelectItem>
              <SelectItem value="RUB">RUB (Russian Ruble)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-6">
          <Checkbox
            id="vat_payer"
            checked={companySettings.vat_payer || false}
            onCheckedChange={(checked) => {
              onCompanyFieldChange("vat_payer", checked as boolean);
              onCompanyFieldCommit();
            }}
          />
          <Label htmlFor="vat_payer">{t("adminSettings.vatPayer")}</Label>
        </div>
      </div>
    </div>
  );
};
