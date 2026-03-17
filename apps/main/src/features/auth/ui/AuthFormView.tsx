import { Button } from "@gridix/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui/card";
import { Input } from "@gridix/ui/input";
import { Label } from "@gridix/ui/label";
import { Checkbox } from "@gridix/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@gridix/ui/tabs";
import { Alert, AlertDescription } from "@gridix/ui/alert";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { AuthFormData, PartnerInfo } from "../model/useAuthFormController";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

interface AuthFormViewProps {
  t: (key: string) => string;
  mode: "signin" | "signup";
  loading: boolean;
  showPassword: boolean;
  resetLoading: boolean;
  resetEmail: string;
  showReset: boolean;
  formData: AuthFormData;
  refCode: string | null;
  checkingPartner: boolean;
  partnerInfo: PartnerInfo | null;
  marketingEmailsConsent: boolean;
  onModeChange: (mode: "signin" | "signup") => void;
  onTogglePassword: () => void;
  onResetEmailChange: (email: string) => void;
  onOpenReset: () => void;
  onCloseReset: () => void;
  onFormDataChange: (patch: Partial<AuthFormData>) => void;
  onMarketingConsentChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSendReset: () => void;
}

export const AuthFormView = ({
  t,
  mode,
  loading,
  showPassword,
  resetLoading,
  resetEmail,
  showReset,
  formData,
  refCode,
  checkingPartner,
  partnerInfo,
  marketingEmailsConsent,
  onModeChange,
  onTogglePassword,
  onResetEmailChange,
  onOpenReset,
  onCloseReset,
  onFormDataChange,
  onMarketingConsentChange,
  onSubmit,
  onSendReset,
}: AuthFormViewProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl">
            {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "signin"
              ? t("auth.signInDescription")
              : t("auth.signUpDescription")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {refCode && partnerInfo && (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {t("auth.partnerInvitation")}{" "}
                {partnerInfo?.user_profiles?.full_name}
              </AlertDescription>
            </Alert>
          )}

          {checkingPartner && (
            <div className="mb-4 flex items-center justify-center py-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.checkingPartner")}
            </div>
          )}

          <Tabs
            value={mode}
            onValueChange={(value) =>
              onModeChange(value as "signin" | "signup")
            }
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) =>
                        onFormDataChange({ email: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      value={formData.password}
                      onChange={(e) =>
                        onFormDataChange({ password: e.target.value })
                      }
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={onTogglePassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t("auth.fullNamePlaceholder")}
                      value={formData.fullName}
                      onChange={(e) =>
                        onFormDataChange({ fullName: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">{t("auth.companyName")}</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="companyName"
                      type="text"
                      placeholder={t("auth.companyNamePlaceholder")}
                      value={formData.companyName}
                      onChange={(e) =>
                        onFormDataChange({ companyName: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) =>
                        onFormDataChange({ email: e.target.value })
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      value={formData.password}
                      onChange={(e) =>
                        onFormDataChange({ password: e.target.value })
                      }
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={onTogglePassword}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="marketing-consent"
                    checked={marketingEmailsConsent}
                    onCheckedChange={(checked) =>
                      onMarketingConsentChange(checked === true)
                    }
                  />
                  <Label
                    htmlFor="marketing-consent"
                    className="cursor-pointer text-xs font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {t("auth.marketingEmailsConsent")}
                  </Label>
                </div>
              </TabsContent>

              <Button
                type="submit"
                className="w-full"
                disabled={loading || checkingPartner}
              >
                {loading
                  ? t("auth.loading")
                  : mode === "signin"
                    ? t("auth.signInButton")
                    : t("auth.signUpButton")}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={onOpenReset}
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>
            </form>

            {mode === "signup" && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {t("auth.essentialEmailsNote")}
              </p>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {showReset && (
        <ResetPasswordDialog
          t={t}
          resetEmail={resetEmail}
          resetLoading={resetLoading}
          onEmailChange={onResetEmailChange}
          onClose={onCloseReset}
          onSend={onSendReset}
        />
      )}
    </div>
  );
};
