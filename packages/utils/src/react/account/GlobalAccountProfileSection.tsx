import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import {
  useAccountProfileSettings,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "./useAccountProfileSettings";

export interface GlobalAccountProfileSectionProps {
  userId: string | undefined;
  /** When provided, the parent can read profile data for external save. */
  onReady?: (api: ReturnType<typeof useAccountProfileSettings>) => void;
}

export function GlobalAccountProfileSection({
  userId,
  onReady,
}: GlobalAccountProfileSectionProps) {
  const api = useAccountProfileSettings({ userId });
  const {
    profileData,
    preferredLocale,
    setPreferredLocale,
    handleProfileFieldChange,
    t,
  } = api;

  React.useEffect(() => {
    onReady?.(api);
  }, [api, onReady]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("adminSettings.profileInfo")}</CardTitle>
        <CardDescription>{t("adminSettings.profileInfoDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="full_name">{t("adminSettings.fullName")}</Label>
            <Input
              id="full_name"
              value={profileData.full_name}
              onChange={(e) =>
                handleProfileFieldChange("full_name", e.target.value)
              }
              placeholder={t("adminSettings.fullNamePlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="profile_phone">{t("adminSettings.phone")}</Label>
            <Input
              id="profile_phone"
              value={profileData.phone}
              onChange={(e) =>
                handleProfileFieldChange("phone", e.target.value)
              }
              placeholder={t("adminSettings.phonePlaceholder")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="preferred_locale">
              {t("adminSettings.language")}
            </Label>
            <Select
              value={preferredLocale}
              onValueChange={(v) => setPreferredLocale(v as SupportedLocale)}
            >
              <SelectTrigger id="preferred_locale">
                <SelectValue placeholder="en" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LOCALES.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-muted-foreground text-xs">
              {t("adminSettings.languageHint")}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
