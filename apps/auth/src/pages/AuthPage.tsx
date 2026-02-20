import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase, supabaseAuthInitPromise } from "@gridix/utils/api";
import {
  hasAuthTokensInHash,
  consumeSupabaseSessionFromUrl,
  useCurrentSession,
} from "@gridix/utils";
import { useLanguageNavigation, useLanguage } from "@gridix/utils/react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Alert,
  AlertDescription,
  Button,
  Input,
  Label,
} from "@gridix/ui";
import { CheckCircle, Loader2 } from "lucide-react";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import ResetPasswordForm from "@/components/Auth/ResetPasswordForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SignInPage, type AccountType } from "@/components/ui/sign-in";

function safeRedirectUrl(input: string | null): string | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    const allowed = new Set(
      [
        (import.meta as any).env?.VITE_MAIN_APP_URL,
        (import.meta as any).env?.VITE_AGENT_CABINET_URL,
        (import.meta as any).env?.VITE_PARTNERS_APP_URL,
      ].filter(Boolean),
    );
    // allow same-origin and known app bases
    if (u.origin === window.location.origin) return u.toString();
    for (const base of allowed) {
      const b = String(base);
      if (b && u.origin === new URL(b).origin) return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

async function redirectByAccountType(params: {
  session: Awaited<
    ReturnType<typeof supabase.auth.getSession>
  >["data"]["session"];
  redirectToUrl?: string | null;
  lang: string;
}) {
  const { session } = params;
  if (!session?.user?.id) return;

  const userId = session.user.id;
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("account_type")
    .eq("id", userId)
    .maybeSingle();
  const accountType =
    typeof (profile as any)?.account_type === "string"
      ? String((profile as any).account_type)
      : "developer";

  const mainAppUrl =
    (import.meta as any).env?.VITE_MAIN_APP_URL || "https://app.gridix.live";
  const agentCabinetUrl =
    (import.meta as any).env?.VITE_AGENT_CABINET_URL ||
    "https://agent.gridix.live";
  const partnersAppUrl =
    (import.meta as any).env?.VITE_PARTNERS_APP_URL ||
    "https://partner.gridix.live";

  let targetBase: string;
  if (accountType === "agent") {
    targetBase = agentCabinetUrl;
  } else if (accountType === "partner") {
    targetBase = partnersAppUrl;
  } else {
    targetBase = mainAppUrl;
  }

  const safe = safeRedirectUrl(params.redirectToUrl ?? null);
  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    token_type: "bearer",
    type: "magiclink",
  }).toString();

  if (safe) {
    const u = new URL(safe);
    const mainOrigin = new URL(mainAppUrl).origin;
    const agentOrigin = new URL(agentCabinetUrl).origin;
    const partnersOrigin = new URL(partnersAppUrl).origin;

    // Guard: prevent cross-account-type redirects
    const isAgentTarget = u.origin === agentOrigin;
    const isMainTarget = u.origin === mainOrigin;
    const isPartnerTarget = u.origin === partnersOrigin;

    const wrongTarget =
      (isAgentTarget && accountType !== "agent") ||
      (isMainTarget &&
        (accountType === "agent" || accountType === "partner")) ||
      (isPartnerTarget && accountType !== "partner");

    if (!wrongTarget) {
      const base = `${u.origin}${u.pathname}${u.search}`;
      window.location.href = `${base}#${hash}`;
      return;
    }
  }

  // Default landing
  let defaultPath: string;
  if (accountType === "agent") {
    defaultPath = `${targetBase}/${params.lang}/`;
  } else if (accountType === "partner") {
    defaultPath = `${targetBase}/${params.lang}/`;
  } else {
    defaultPath = `${targetBase}/${params.lang}/admin`;
  }
  window.location.href = `${defaultPath}#${hash}`;
}

const SIGNIN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80";

export default function AuthPage() {
  const { navigate } = useLanguageNavigation();
  const { t, language } = useLanguage();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    data: sessionQuery,
    isLoading: isSessionLoading,
    refetch: refetchSession,
  } = useCurrentSession();

  const redirectToUrl = searchParams.get("redirect_to");
  const mode = searchParams.get("mode");
  const [isRecovery, setIsRecovery] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const [accountType, setAccountType] = useState<AccountType>("developer");
  const [authLoading, setAuthLoading] = useState(false);

  const [loading] = useState(false);

  const isSignup = location.pathname.includes("/signup");
  const isSignin = location.pathname.includes("/signin");
  const lang = window.location.pathname.split("/")[1] || "en";

  const refCode = searchParams.get("ref");
  const inviteCode = searchParams.get("invite");
  const clickTrackedForRef = useRef<string | null>(null);

  // Link clicks: при заходе с ?ref= учитываем клик в аналитике партнёра (один раз за визит)
  const utmSource = searchParams.get("utm_source")?.trim() || null;
  const utmMedium = searchParams.get("utm_medium") || null;
  const utmCampaign = searchParams.get("utm_campaign") || null;
  useEffect(() => {
    if (!refCode || typeof window === "undefined") return;
    if (clickTrackedForRef.current === refCode) return;
    clickTrackedForRef.current = refCode;

    supabase.functions
      .invoke("partner-program", {
        body: {
          action: "track_click",
          partner_code: refCode,
          utm_source: utmSource ?? "direct",
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        },
      })
      .then(({ error }) => {
        if (error) console.error("Partner track_click:", error);
      })
      .catch((err) => console.error("Partner track_click:", err));
  }, [refCode, utmSource, utmMedium, utmCampaign]);

  const [partnerInfo, setPartnerInfo] = useState<{
    id: string;
    partner_code: string;
    user_profiles: { full_name: string | null; email: string | null };
  } | null>(null);
  const [checkingPartner, setCheckingPartner] = useState(false);

  const hashIndicatesRecovery = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash || "";
    return /type=recovery/.test(hash);
  }, []);

  useEffect(() => {
    if (mode === "recovery" || hashIndicatesRecovery) setIsRecovery(true);
  }, [mode, hashIndicatesRecovery]);

  // When magic link lands on /en/auth#access_token=... (or any path with hash tokens), consume and redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasAuthTokensInHash()) return;
    let cancelled = false;
    const run = async () => {
      await consumeSupabaseSessionFromUrl(supabase);
      if (cancelled) return;
      try {
        await supabaseAuthInitPromise;
      } catch {
        // ignore
      }
      if (cancelled) return;
      const { data } = await refetchSession();
      const session = data?.session ?? sessionQuery?.session ?? null;
      if (cancelled || isSessionLoading || !session?.user?.id) return;
      await redirectByAccountType({
        session,
        redirectToUrl: redirectToUrl ?? null,
        lang: window.location.pathname.split("/")[1] || "en",
      });
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [isSessionLoading, redirectToUrl, refetchSession, sessionQuery?.session]);

  useEffect(() => {
    const checkPartner = async () => {
      if (!refCode) {
        setPartnerInfo(null);
        return;
      }
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
          setPartnerInfo(null);
          return;
        }
        setPartnerInfo(data as any);
      } catch (error: unknown) {
        console.error("Error checking partner:", error);
        toast.error(t("auth.failedToCheckPartner"));
      } finally {
        setCheckingPartner(false);
      }
    };
    void checkPartner();
  }, [refCode, t]);

  const handleSendReset = async () => {
    if (!resetEmail) {
      toast.error(t("auth.enterEmail"));
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/${lang}/auth?mode=recovery`,
      });
      if (error) throw error;
      toast.success(t("auth.resetEmailSent"));
      setResetModalOpen(false);
      setResetEmail("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t("auth.failedToSendEmail");
      console.error("Reset email error:", err);
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  if (loading) return <FullPageLoaderView />;

  if (isRecovery) {
    return (
      <ResetPasswordForm
        onSuccess={() => {
          if (typeof window !== "undefined") window.location.hash = "";
          navigate("/auth");
        }}
      />
    );
  }

  return (
    <>
      <div className="fixed right-6 top-6 z-50 md:left-6 md:right-auto">
        <LanguageSwitcher />
      </div>
      <SignInPage
        defaultMode={isSignup ? "signup" : isSignin ? "signin" : "signin"}
        heroImageSrc={SIGNIN_HERO_IMAGE}
        banner={
          <>
            {refCode && partnerInfo && (
              <Alert className="animate-delay-220 animate-element">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("auth.partnerInvitation")}{" "}
                  {partnerInfo?.user_profiles?.full_name}
                </AlertDescription>
              </Alert>
            )}
            {checkingPartner && (
              <div className="animate-delay-220 flex animate-element items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("auth.checkingPartner")}
              </div>
            )}
          </>
        }
        accountType={accountType}
        onAccountTypeChange={setAccountType}
        loading={authLoading}
        labels={{
          signInTab: t("auth.signIn"),
          signUpTab: t("auth.signUp"),
          signInTitle: t("auth.signInTitle"),
          signUpTitle: t("auth.signUpTitle"),
          signInDescription: t("auth.signInDescription"),
          emailLabel: t("auth.email"),
          emailPlaceholder: t("auth.emailPlaceholder"),
          passwordLabel: t("auth.password"),
          passwordPlaceholder: t("auth.passwordPlaceholder"),
          fullNameLabel: t("auth.fullName"),
          fullNamePlaceholder: t("auth.fullNamePlaceholder"),
          companyNameLabel: t("auth.companyName"),
          companyNamePlaceholder: t("auth.companyNamePlaceholder"),
          phoneLabel: t("auth.phone"),
          phonePlaceholder: t("auth.phonePlaceholder"),
          accountTypeLabel: t("auth.selectAccountType"),
          accountTypeDeveloper: t("auth.developer"),
          accountTypePartner: t("auth.partner"),
          marketingEmailsConsent: t("auth.marketingEmailsConsent"),
          rememberMe: t("auth.keepMeSignedIn"),
          resetPassword: t("auth.resetPasswordLink"),
          signInButton: t("auth.signInButton"),
          signUpButton: t("auth.signUpButton"),
          orContinueWith: t("auth.orContinueWith"),
          continueWithGoogle: t("auth.continueWithGoogle"),
          createAccountPrompt: t("auth.createAccountPrompt"),
          createAccountLink: t("auth.createAccountLink"),
          alreadyHaveAccountPrompt: t("auth.alreadyHaveAccountPrompt"),
          alreadyHaveAccountLink: t("auth.alreadyHaveAccountLink"),
        }}
        onResetPassword={() => setResetModalOpen(true)}
        onSubmit={async (payload) => {
          setAuthLoading(true);
          try {
            if (payload.mode === "signin") {
              const { error } = await supabase.auth.signInWithPassword({
                email: payload.email,
                password: payload.password,
              });
              if (error) throw error;
              toast.success(t("auth.welcome"));
              const currentSession =
                (await refetchSession()).data?.session ?? null;
              await redirectByAccountType({
                session: currentSession,
                redirectToUrl: redirectToUrl ?? null,
                lang,
              });
              return;
            }

            // signup
            const { data: authData, error } = await supabase.auth.signUp({
              email: payload.email,
              password: payload.password,
              options: {
                data: {
                  full_name: payload.fullName,
                  company_name: payload.companyName,
                  phone: payload.phone,
                  account_type: payload.accountType,
                  partner_id: partnerInfo?.id || null,
                  marketing_emails_consent:
                    payload.marketingEmailsConsent ?? false,
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
                  .eq("email", payload.email);
                if (inviteError)
                  console.error("Error updating invitation:", inviteError);
              }
            }

            toast.success(t("auth.checkEmail"));
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : t("auth.errorOccurred");
            console.error("Auth error:", err);
            toast.error(message);
          } finally {
            setAuthLoading(false);
          }
        }}
        /*  onGoogleSignIn={({ accountType: selectedAccountType }) => {
          try {
            localStorage.setItem(LS_PENDING_ACCOUNT_TYPE, selectedAccountType);
            if (refCode) localStorage.setItem(LS_PENDING_REF, refCode);
            else localStorage.removeItem(LS_PENDING_REF);
            if (inviteCode) localStorage.setItem(LS_PENDING_INVITE, inviteCode);
            else localStorage.removeItem(LS_PENDING_INVITE);
          } catch {
            // ignore storage issues
          }

          void supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/${lang}/auth/callback${
                redirectToUrl ? `?redirect_to=${encodeURIComponent(redirectToUrl)}` : ""
              }`,
            },
          });
        }} */
      />

      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("auth.resetPasswordTitle")}</DialogTitle>
            <DialogDescription>
              {t("auth.resetPasswordDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t("auth.resetEmail")}</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setResetModalOpen(false)}
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
        </DialogContent>
      </Dialog>
    </>
  );
}
