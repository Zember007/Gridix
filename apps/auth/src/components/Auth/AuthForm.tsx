import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@gridix/ui";
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
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { useLanguage } from "@gridix/utils/react";
import { getLanguageFromPath } from "@gridix/utils/lib";

type AccountType = "developer" | "agent" | "partner";

interface AuthFormProps {
  onSuccess?: () => void;
  defaultMode?: "signin" | "signup" | undefined;
}

export function AuthForm({ onSuccess, defaultMode }: AuthFormProps) {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">(
    defaultMode || "signin",
  );
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [marketingEmailsConsent, setMarketingEmailsConsent] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("developer");

  const refCode = searchParams.get("ref");
  const inviteCode = searchParams.get("invite");
  const [partnerInfo, setPartnerInfo] = useState<{
    id: string;
    partner_code: string;
    user_profiles: { full_name: string | null; email: string | null };
  } | null>(null);
  const [checkingPartner, setCheckingPartner] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    phone: "",
  });

  useEffect(() => {
    const checkPartner = async () => {
      if (!refCode) return;
      setCheckingPartner(true);
      try {
        const { data, error } = await supabase
          .from("partner_profiles")
          .select(
            `
            id,
            partner_code,
            user_profiles!partner_profiles_user_id_fkey (
              full_name,
              email
            )
          `,
          )
          .eq("partner_code", refCode)
          .single();

        if (error || !data) {
          toast.error(t("auth.invalidReferralCode"));
          return;
        }
        setPartnerInfo(data as any);
      } catch (error) {
        console.error("Error checking partner:", error);
        toast.error(t("auth.failedToCheckPartner"));
      } finally {
        setCheckingPartner(false);
      }
    };
    void checkPartner();
  }, [refCode, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data: authData, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              company_name: formData.companyName,
              phone: formData.phone,
              account_type: accountType,
              partner_id: partnerInfo?.id || null,
              marketing_emails_consent: marketingEmailsConsent,
              preferred_locale: language,
            },
          },
        });
        if (error) throw error;

        if (authData.user) {
          if (refCode && partnerInfo) {
            const { error: linkError } = await supabase
              .from("partner_links")
              .insert({
                partner_id: partnerInfo.id,
                client_id: authData.user.id,
                type: "referral",
                status: "active",
                accepted_at: new Date().toISOString(),
              } as any);
            if (linkError)
              console.error("Error creating partner link:", linkError);
          }

          if (inviteCode) {
            const { error: inviteError } = await supabase
              .from("partner_invitations")
              .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
              } as any)
              .eq("invitation_code", inviteCode)
              .eq("email", formData.email);
            if (inviteError)
              console.error("Error updating invitation:", inviteError);
          }
        }

        toast.success(t("auth.checkEmail"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast.success(t("auth.welcome"));
        onSuccess?.();
      }
    } catch (error: any) {
      const message =
        error instanceof Error ? error.message : t("auth.errorOccurred");
      console.error("Auth error:", error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async () => {
    if (!resetEmail) {
      toast.error(t("auth.enterEmail"));
      return;
    }
    setResetLoading(true);
    try {
      const lang = getLanguageFromPath(window.location.pathname) || "en";
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/${lang}/auth/signin?mode=recovery`,
      });
      if (error) throw error;
      toast.success(t("auth.resetEmailSent"));
      setShowReset(false);
    } catch (err: any) {
      const message =
        err instanceof Error ? err.message : t("auth.failedToSendEmail");
      console.error("Reset email error:", err);
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  const showAccountTypeSelector = mode === "signup";

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

          <Tabs value={mode} onValueChange={(value) => setMode(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <TabsContent value="signin" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="pl-10 pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
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
                {showAccountTypeSelector && (
                  <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 p-1">
                    <button
                      type="button"
                      onClick={() => setAccountType("developer")}
                      className={[
                        "rounded-lg py-2 text-sm font-extrabold",
                        accountType === "developer"
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {t("auth.developer")}
                    </button>
                    {/* <button
                      type="button"
                      onClick={() => setAccountType("agent")}
                      className={[
                        "py-2 rounded-lg text-sm font-extrabold",
                        accountType === "agent"
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      Agent
                    </button> */}
                    <button
                      type="button"
                      onClick={() => setAccountType("partner")}
                      className={[
                        "rounded-lg py-2 text-sm font-extrabold",
                        accountType === "partner"
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      {t("auth.partner")}
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t("auth.fullNamePlaceholder")}
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {accountType === "developer" && (
                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t("auth.companyName")}</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="companyName"
                        type="text"
                        placeholder={t("auth.companyNamePlaceholder")}
                        value={formData.companyName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            companyName: e.target.value,
                          }))
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.passwordPlaceholder")}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
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
                      onClick={() => setShowPassword(!showPassword)}
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
                      setMarketingEmailsConsent(checked === true)
                    }
                  />
                  <Label
                    htmlFor="marketing-consent"
                    className="cursor-pointer text-xs font-normal leading-none"
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
                  onClick={() => setShowReset(true)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-background shadow-lg">
            <div className="border-b p-6">
              <h2 className="text-lg font-semibold">
                {t("auth.resetPasswordTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("auth.resetPasswordDescription")}
              </p>
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email">{t("auth.resetEmail")}</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder={t("auth.emailPlaceholder")}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setShowReset(false)}
                >
                  {t("auth.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleSendReset}
                  disabled={resetLoading}
                >
                  {resetLoading ? t("auth.sending") : t("auth.sendLink")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
