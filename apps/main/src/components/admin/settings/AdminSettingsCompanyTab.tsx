import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@gridix/ui";
import { Building, Link as LinkIcon, Upload } from "lucide-react";
import type { ChangeEvent } from "react";

import type { Tables } from "@gridix/types/database";

type CompanySettingsRow = Tables<"company_settings">;

export type AdminSettingsCompanyTabProps = {
  settingsCompanyName: string;
  onBrandNameChange: (value: string) => void;

  companySettings: CompanySettingsRow;
  onCompanyFieldChange: (
    field: keyof CompanySettingsRow,
    value: string | boolean | null,
  ) => void;

  systemDomain: string;

  logoInputRef: React.RefObject<HTMLInputElement>;
  uploadingLogo: boolean;
  onLogoFileChange: (e: ChangeEvent<HTMLInputElement>) => void;

  t: (key: string, vars?: Record<string, unknown>) => string;
};

export function AdminSettingsCompanyTab(props: AdminSettingsCompanyTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{props.t("adminSettings.companyLogo")}</Label>
        <div className="flex items-center gap-4">
          <div
            className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-dashed bg-muted"
            role="button"
            tabIndex={0}
            onClick={() => props.logoInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                props.logoInputRef.current?.click();
            }}
          >
            {props.companySettings.logo_url ? (
              <img
                src={props.companySettings.logo_url}
                alt="Company logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <Building className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={props.logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={props.onLogoFileChange}
            />
            <Button
              type="button"
              variant="outline"
              disabled={props.uploadingLogo}
              onClick={() => props.logoInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {props.uploadingLogo
                ? props.t("adminSettings.saving")
                : props.t("adminSettings.uploadLogo")}
            </Button>
            <p className="text-xs text-muted-foreground">
              {props.t("adminSettings.logoHint")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <div className="font-medium">
            {props.t("adminSettings.systemDomain")}
          </div>
        </div>
        <div className="break-all font-mono text-sm">
          https://{props.systemDomain}
        </div>
        <p className="text-xs text-muted-foreground">
          {props.t("adminSettings.systemDomainHint")}
        </p>
      </div>

      <div>
        <Label htmlFor="brand_name">{props.t("adminSettings.brandName")}</Label>
        <Input
          id="brand_name"
          value={props.settingsCompanyName}
          onChange={(e) => props.onBrandNameChange(e.target.value)}
          placeholder={props.t("adminSettings.brandNamePlaceholder")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="website">{props.t("adminSettings.website")}</Label>
          <Input
            id="website"
            value={props.companySettings.website || ""}
            onChange={(e) =>
              props.onCompanyFieldChange("website", e.target.value || null)
            }
            placeholder={props.t("adminSettings.websitePlaceholder")}
          />
        </div>
        <div>
          <Label htmlFor="industry">{props.t("adminSettings.industry")}</Label>
          <Select
            value={props.companySettings.industry || ""}
            onValueChange={(value) =>
              props.onCompanyFieldChange("industry", value || null)
            }
          >
            <SelectTrigger id="industry">
              <SelectValue
                placeholder={props.t("adminSettings.industryPlaceholder")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real_estate">
                {props.t("adminSettings.industryRealEstate")}
              </SelectItem>
              <SelectItem value="investment">
                {props.t("adminSettings.industryInvestment")}
              </SelectItem>
              <SelectItem value="marketing">
                {props.t("adminSettings.industryMarketing")}
              </SelectItem>
              <SelectItem value="development">
                {props.t("adminSettings.industryDevelopment")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="company_description">
          {props.t("adminSettings.companyDescription")}
        </Label>
        <Textarea
          id="company_description"
          value={props.companySettings.description || ""}
          onChange={(e) =>
            props.onCompanyFieldChange("description", e.target.value || null)
          }
          placeholder={props.t("adminSettings.companyDescriptionPlaceholder")}
          rows={4}
        />
      </div>
    </div>
  );
}
