import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { supabase, supabaseAuthInitPromise } from "@gridix/utils/api";
import {
  hasAuthTokensInHash,
  consumeSupabaseSessionFromUrl,
  useCurrentSession,
  usePartnerByCode,
  linkPartnerToClient,
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
import { redirectToAppByAccountType } from "@/shared/lib/redirectByAccountType";

const LS_PENDING_ACCOUNT_TYPE = "gridix_auth_pending_account_type";
const LS_PENDING_REF = "gridix_auth_pending_ref";
const LS_PENDING_INVITE = "gridix_auth_pending_invite";

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
  const lang = window.location.pathname.split("/")[1] || "en";
  const aboutPlatformUrl = `https://gridix.live/${lang === "ru" ? "" : lang}`;
  const privacyPolicyUrl = `https://gridix.live/${lang}/privacy/`;
  const offerAgreementUrl = `https://gridix.live/${lang}/offerta/`;

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

  const {
    data: partnerInfo,
    isLoading: checkingPartner,
    error: partnerError,
  } = usePartnerByCode(refCode);
  const partnerDisplayName =
    partnerInfo?.user_profiles?.full_name?.trim() ||
    partnerInfo?.user_profiles?.email?.trim() ||
    partnerInfo?.partner_code ||
    null;

  const hashIndicatesRecovery = useMemo(() => {
    if (typeof window === "undefined") return false;
    const hash = window.location.hash || "";
    return /type=recovery/.test(hash);
  }, []);

  useEffect(() => {
    if (mode === "recovery" || hashIndicatesRecovery) setIsRecovery(true);
  }, [mode, hashIndicatesRecovery]);

  // When magic link lands on /en/auth/signin#access_token=... (or any path with hash tokens), consume and redirect
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
      const session = data?.session ?? null;
      if (cancelled || !session?.user?.id) return;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("account_type, full_name, company_name")
        .eq("id", session.user.id)
        .maybeSingle();

      const isProfileValid =
        profile &&
        profile.account_type &&
        profile.full_name &&
        (profile.account_type !== "developer" || profile.company_name);

      if (!isProfileValid) {
        navigate(
          `/auth/complete-profile${redirectToUrl ? `?redirect_to=${encodeURIComponent(redirectToUrl)}` : ""}`,
        );
        return;
      }

      await redirectToAppByAccountType(supabase, session, {
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
    if (!refCode) return;
    if (checkingPartner) return;
    if (!partnerInfo || partnerError) {
      toast.error(t("auth.invalidReferralCode"));
    }
  }, [checkingPartner, partnerError, partnerInfo, refCode, t]);

  const handleSendReset = async () => {
    if (!resetEmail) {
      toast.error(t("auth.enterEmail"));
      return;
    }
    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/${lang}/auth/signin?mode=recovery`,
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
          navigate("/auth/signin");
        }}
      />
    );
  }

  return (
    <>
      <div className="fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-xl border border-white/40 bg-white/70 px-3 py-2 shadow-[0_0_18px_rgba(15,23,42,0.14)] backdrop-blur-md md:hidden">
        <div className="flex items-center justify-between gap-3">
          <LanguageSwitcher />
          <a
            href={aboutPlatformUrl}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center justify-center gap-1 rounded-sm text-sm font-normal leading-none text-[#1f2430]"
          >
            <img
              src="/apple-touch-icon.png"
              alt="Gridix"
              className="h-8 w-8 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.22)]"
            />
            <span className="whitespace-nowrap duration-200 group-hover:underline">
              {t("auth.aboutPlatform")}
            </span>
          </a>
        </div>
      </div>
      <div className="fixed left-4 top-6 z-50 hidden md:block">
        <LanguageSwitcher />
      </div>
      <div className="fixed top-6 z-40 hidden rounded-xl border border-white/40 bg-white/70 px-2 py-0.5 py-1 shadow-[0_0_18px_rgba(15,23,42,0.14)] backdrop-blur-md md:right-auto md:flex md:[inset-inline-end:calc(50vw+22px)] md:[inset-inline-start:auto]">
        <a
          href={aboutPlatformUrl}
          target="_blank"
          rel="noreferrer"
          className="group inline-flex items-center justify-center gap-1 rounded-sm text-sm font-normal leading-none text-[#1f2430]"
        >
          <img
            src="/apple-touch-icon.png"
            alt="Gridix"
            className="h-6 w-6 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.22)]"
          />
          <span className="duration-200 group-hover:underline">
            {t("auth.aboutPlatform")}
          </span>
        </a>
      </div>
      <div className="pt-16 md:pt-20 lg:pt-8">
        <SignInPage
          defaultMode={isSignup ? "signup" : "signin"}
          onModeChange={(nextMode) =>
            navigate(`/auth/${nextMode}${location.search}`)
          }
          heroImageSrc={SIGNIN_HERO_IMAGE}
          banner={
            <>
              {isSignup && refCode && partnerInfo && (
                <Alert className="animate-delay-220 animate-element">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t("auth.partnerInvitation")} {partnerDisplayName}
                    {partnerInfo?.partner_code
                      ? ` (${partnerInfo.partner_code})`
                      : ""}
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
            privacyOfferAgreement: (
              <>
                {t("auth.privacyOfferAgreementPrefix")}{" "}
                <a
                  href={privacyPolicyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--admin-primary)] underline underline-offset-2 transition-colors"
                >
                  {t("auth.privacyPolicyLabel")}
                </a>{" "}
                {t("auth.privacyOfferAgreementAnd")}{" "}
                <a
                  href={offerAgreementUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--admin-primary)] underline underline-offset-2 transition-colors"
                >
                  {t("auth.offerAgreementLabel")}
                </a>
                .
              </>
            ),
            marketingEmailsConsent: t("auth.marketingEmailsConsent"),
            rememberMe: t("auth.keepMeSignedIn"),
            resetPassword: t("auth.resetPasswordLink"),
            signInButton: t("auth.signInButton"),
            signUpButton: t("auth.signUpButton"),
            orContinueWith: t("auth.orContinueWith"),
            orViaSocials: t("auth.orViaSocials"),
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
                if (currentSession) {
                  await redirectToAppByAccountType(supabase, currentSession, {
                    redirectToUrl: redirectToUrl ?? null,
                    lang,
                  });
                }
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
                await linkPartnerToClient({
                  authUserId: authData.user.id,
                  partnerId: partnerInfo?.id ?? null,
                  inviteCode,
                  email: payload.email,
                });
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
          onGoogleSignIn={({
            mode: signInMode,
            accountType: selectedAccountType,
          }) => {
            try {
              if (signInMode === "signup") {
                localStorage.setItem(
                  LS_PENDING_ACCOUNT_TYPE,
                  selectedAccountType,
                );
              } else {
                localStorage.removeItem(LS_PENDING_ACCOUNT_TYPE);
              }
              if (refCode) localStorage.setItem(LS_PENDING_REF, refCode);
              else localStorage.removeItem(LS_PENDING_REF);
              if (inviteCode)
                localStorage.setItem(LS_PENDING_INVITE, inviteCode);
              else localStorage.removeItem(LS_PENDING_INVITE);
            } catch {
              // storage might be unavailable (private mode)
            }

            void supabase.auth.signInWithOAuth({
              provider: "google",
              options: {
                redirectTo: `${window.location.origin}/${lang}/auth/callback${
                  redirectToUrl
                    ? `?redirect_to=${encodeURIComponent(redirectToUrl)}`
                    : ""
                }`,
              },
            });
          }}
        />
      </div>

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
