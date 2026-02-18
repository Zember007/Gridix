import React from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@gridix/ui";
import { useAccountSecurity } from "./useAccountSecurity";
import { toast } from "sonner";

export interface GlobalAccountSecuritySectionProps {
  userEmail: string;
  /** Optional theme colors for consistent button styling */
  primaryColor?: string;
  primaryHoverColor?: string;
  textOnPrimaryColor?: string;
}

export function GlobalAccountSecuritySection({
  userEmail,
  primaryColor,
  primaryHoverColor,
  textOnPrimaryColor,
}: GlobalAccountSecuritySectionProps) {
  const {
    newEmail,
    setNewEmail,
    updatingEmail,
    handleUpdateEmail,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    updatingPassword,
    handleUpdatePassword,
    t,
  } = useAccountSecurity();

  const btnStyle = primaryColor
    ? { backgroundColor: primaryColor, color: textOnPrimaryColor ?? "#fff" }
    : undefined;

  const onEmailHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!updatingEmail && newEmail && primaryHoverColor) {
      e.currentTarget.style.backgroundColor = primaryHoverColor;
    }
  };
  const onEmailLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!updatingEmail && newEmail && primaryColor) {
      e.currentTarget.style.backgroundColor = primaryColor;
    }
  };

  const onPasswordHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (
      !updatingPassword &&
      newPassword &&
      confirmPassword &&
      primaryHoverColor
    ) {
      e.currentTarget.style.backgroundColor = primaryHoverColor;
    }
  };
  const onPasswordLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!updatingPassword && newPassword && confirmPassword && primaryColor) {
      e.currentTarget.style.backgroundColor = primaryColor;
    }
  };

  const onUpdateEmail = async () => {
    const result = await handleUpdateEmail();
    if (result.success) {
      toast.success(t("adminSettings.emailUpdated"));
    } else if (result.errorKey) {
      toast.error(t(result.errorKey));
    }
  };

  const onUpdatePassword = async () => {
    const result = await handleUpdatePassword();
    if (result.success) {
      toast.success(t("adminSettings.passwordUpdated"));
    } else if (result.errorKey) {
      toast.error(t(result.errorKey));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("adminSettings.changeEmail")}</CardTitle>
          <CardDescription>
            {t("adminSettings.accountInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="current_email">
              {t("adminSettings.currentEmail")}
            </Label>
            <Input
              id="current_email"
              type="email"
              value={userEmail}
              disabled
              className="bg-muted"
            />
          </div>
          <div>
            <Label htmlFor="new_email">{t("adminSettings.newEmail")}</Label>
            <Input
              id="new_email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <Button
            onClick={onUpdateEmail}
            disabled={updatingEmail || !newEmail}
            style={btnStyle}
            onMouseEnter={onEmailHover}
            onMouseLeave={onEmailLeave}
          >
            {updatingEmail
              ? t("adminSettings.saving")
              : t("adminSettings.updateEmail")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("adminSettings.changePassword")}</CardTitle>
          <CardDescription>
            {t("adminSettings.accountInfoDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="new_password">
              {t("adminSettings.newPassword")}
            </Label>
            <Input
              id="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("adminSettings.newPasswordPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="confirm_password">
              {t("adminSettings.confirmNewPassword")}
            </Label>
            <Input
              id="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("adminSettings.confirmPasswordPlaceholder")}
            />
          </div>
          <Button
            onClick={onUpdatePassword}
            disabled={updatingPassword || !newPassword || !confirmPassword}
            style={btnStyle}
            onMouseEnter={onPasswordHover}
            onMouseLeave={onPasswordLeave}
          >
            {updatingPassword
              ? t("adminSettings.saving")
              : t("adminSettings.updatePassword")}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
