import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import heroVideoSrc from "@/assets/gridix-intro.webm";

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 48 48"
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z"
    />
  </svg>
);

const FacebookIcon = () => (
  <svg
    fill="#fff"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
  </svg>
);

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export type AccountType = "developer" | "partner";

type AuthMode = "signin" | "signup";

type SubmitPayload = {
  mode: AuthMode;
  accountType: AccountType;
  email: string;
  password: string;
  fullName?: string;
  companyName?: string;
  phone?: string;
  marketingEmailsConsent?: boolean;
  rememberMe?: boolean;
};

export interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onResetPassword?: () => void;
  /**
   * Called for BOTH sign-in and sign-up submits. Use `payload.mode` to branch.
   */
  onSubmit?: (payload: {
    mode: AuthMode;
    accountType: AccountType;
    email: string;
    password: string;
    fullName?: string;
    companyName?: string;
    phone?: string;
    marketingEmailsConsent?: boolean;
    rememberMe?: boolean;
  }) => void | Promise<void>;
  /**
   * Starts Google OAuth. Component guarantees that accountType is provided.
   */
  onGoogleSignIn?: (payload: {
    mode: AuthMode;
    accountType: AccountType;
  }) => void;
  onModeChange?: (mode: AuthMode) => void;
  defaultMode?: AuthMode;
  accountType?: AccountType;
  onAccountTypeChange?: (accountType: AccountType) => void;
  banner?: React.ReactNode;
  loading?: boolean;
  /** Override labels for i18n */
  labels?: {
    signInTab?: string;
    signUpTab?: string;
    signInTitle?: string;
    signUpTitle?: string;
    signInDescription?: string;
    signUpDescription?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    fullNameLabel?: string;
    fullNamePlaceholder?: string;
    companyNameLabel?: string;
    companyNamePlaceholder?: string;
    phoneLabel?: string;
    phonePlaceholder?: string;
    accountTypeLabel?: string;
    accountTypeDeveloper?: string;
    accountTypePartner?: string;
    privacyOfferAgreement?: React.ReactNode;
    marketingEmailsConsent?: string;
    rememberMe?: string;
    resetPassword?: string;
    signInButton?: string;
    signUpButton?: string;
    orContinueWith?: string;
    orViaSocials?: string;
    googleButton?: string;
    facebookButton?: string;
    createAccountPrompt?: string;
    createAccountLink?: string;
    alreadyHaveAccountPrompt?: string;
    alreadyHaveAccountLink?: string;
  };
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="focus-within:border-[var(--admin-primary)]/70 focus-within:bg-[var(--admin-primary)]/10 rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors">
    {children}
  </div>
);

const TestimonialCard = ({
  testimonial,
  delay,
}: {
  testimonial: Testimonial;
  delay: string;
}) => (
  <div
    className={`animate-testimonial ${delay} flex w-64 items-start gap-3 rounded-3xl border border-white/10 bg-card/40 p-5 backdrop-blur-xl dark:bg-zinc-800/40`}
  >
    <img
      src={testimonial.avatarSrc}
      className="h-10 w-10 rounded-2xl object-cover"
      alt=""
    />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title,
  description,
  heroImageSrc,
  testimonials = [],
  onGoogleSignIn,
  onModeChange,
  onResetPassword,
  onSubmit,
  defaultMode = "signin",
  accountType,
  onAccountTypeChange,
  banner,
  loading = false,
  labels = {},
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [internalAccountType, setInternalAccountType] =
    useState<AccountType>("developer");
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (videoReady && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [videoReady]);

  const {
    signInTitle = "Welcome back",
    signUpTitle = "Create your account",
    signInDescription = "Access your account and continue your journey with us",
    signUpDescription = "",
    emailLabel = "Email Address",
    emailPlaceholder = "Enter your email address",
    passwordLabel = "Password",
    passwordPlaceholder = "Enter your password",
    fullNameLabel = "Full Name",
    fullNamePlaceholder = "Enter your full name",
    companyNameLabel = "Company Name",
    companyNamePlaceholder = "Enter your company name",
    phoneLabel = "Phone",
    phonePlaceholder = "Enter your phone number",
    accountTypeLabel = "Account type",
    accountTypeDeveloper = "Developer",
    accountTypePartner = "Partner",
    privacyOfferAgreement = "By continuing, you agree to our Privacy Policy and Offer agreement",
    marketingEmailsConsent = "I agree to receive marketing emails",
    rememberMe = "Keep me signed in",
    resetPassword = "Reset password",
    signInButton = "Sign In",
    signUpButton = "Create account",
    orContinueWith = "Or continue with",
    orViaSocials = "OR VIA SOCIALS",
    googleButton = "Google",
    facebookButton = "Facebook",
    createAccountPrompt = "New to our platform?",
    createAccountLink = "Create Account",
    alreadyHaveAccountPrompt = "Already have an account?",
    alreadyHaveAccountLink = "Sign In",
  } = labels;

  const resolvedAccountType = accountType ?? internalAccountType;
  const setAccountType = (next: AccountType) => {
    onAccountTypeChange?.(next);
    if (!onAccountTypeChange) setInternalAccountType(next);
  };

  const computedTitle = useMemo(() => {
    if (title != null) return title;
    return <span>{mode === "signin" ? signInTitle : signUpTitle}</span>;
  }, [mode, signInTitle, signUpTitle, title]);

  const computedDescription = useMemo(() => {
    if (description != null) return description;
    return mode === "signin" ? signInDescription : signUpDescription;
  }, [description, mode, signInDescription, signUpDescription]);
  const titleBlockClassName =
    mode === "signin"
      ? "animate-delay-100 animate-element relative flex w-[90%] flex-col gap-1.5 pt-5 pr-3 mb-3 before:absolute before:left-[-36px] before:right-[0] before:top-0 before:h-[2px] before:bg-slate-200 after:absolute after:bottom-[-14px] after:right-0 after:top-0 after:w-[2px] after:bg-slate-200"
      : "";
  const titleClassName =
    mode === "signin"
      ? "text-[28px] font-bold tracking-tight text-slate-900"
      : "text-4xl font-medium leading-tight md:text-5xl";
  const titleAnimationClassName =
    mode === "signin" ? "" : "animate-delay-100 animate-element";
  const descriptionClassName =
    mode === "signin"
      ? "text-sm font-semibold text-slate-400"
      : "text-muted-foreground";
  const descriptionAnimationClassName =
    mode === "signin" ? "" : "animate-delay-200 animate-element";

  const oauthBlock = (
    <div className="my-3 flex flex-col gap-3">
      <div className="animate-delay-700 relative flex animate-element items-center justify-center">
        <span className="w-full border-t border-border"></span>
        <span className="absolute bg-background px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {orViaSocials || orContinueWith}
        </span>
      </div>

      <div className="animate-delay-800 grid animate-element grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            if (onGoogleSignIn) {
              void onGoogleSignIn({
                mode,
                accountType: resolvedAccountType,
              });
              return;
            }
            // TODO: Wire up Google OAuth flow.
          }}
          className="flex items-center justify-center gap-3 rounded-2xl border border-border py-2 font-medium transition-colors hover:bg-secondary"
        >
          <GoogleIcon />
          <span>{googleButton}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            // TODO: Wire up Facebook OAuth flow.
          }}
          className="flex items-center justify-center gap-3 rounded-2xl bg-[#1877F2] py-2 font-medium text-white transition-colors hover:bg-[#166FE5]"
        >
          <FacebookIcon />
          <span>{facebookButton}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] w-full flex-col overflow-x-clip font-sans md:flex-row">
      {/* Left column: auth form */}
      <section className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-2">
            <div className={titleBlockClassName}>
              <h1 className={`${titleAnimationClassName} ${titleClassName}`}>
                {computedTitle}
              </h1>
              {computedDescription && (
                <p
                  className={`${descriptionAnimationClassName} ${descriptionClassName}`}
                >
                  {computedDescription}
                </p>
              )}
            </div>

            {banner}

            <form
              key={`auth-form-${mode}`}
              className="flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email =
                  (
                    form.elements.namedItem("email") as HTMLInputElement | null
                  )?.value?.trim() ?? "";
                const password =
                  (
                    form.elements.namedItem(
                      "password",
                    ) as HTMLInputElement | null
                  )?.value ?? "";
                const fullName =
                  (
                    form.elements.namedItem(
                      "fullName",
                    ) as HTMLInputElement | null
                  )?.value?.trim() ?? "";
                const companyName =
                  (
                    form.elements.namedItem(
                      "companyName",
                    ) as HTMLInputElement | null
                  )?.value?.trim() ?? "";
                const phone =
                  (
                    form.elements.namedItem("phone") as HTMLInputElement | null
                  )?.value?.trim() ?? "";
                const marketingEmailsConsent = (
                  form.elements.namedItem(
                    "marketingEmailsConsent",
                  ) as HTMLInputElement | null
                )?.checked;
                const privacyOfferAgreementAccepted = (
                  form.elements.namedItem(
                    "privacyOfferAgreement",
                  ) as HTMLInputElement | null
                )?.checked;
                const rememberMe = (
                  form.elements.namedItem(
                    "rememberMe",
                  ) as HTMLInputElement | null
                )?.checked;

                if (!email || !password) return;
                if (mode === "signup" && !fullName) return;
                if (mode === "signup" && !privacyOfferAgreementAccepted) return;

                const payload: SubmitPayload = {
                  mode,
                  accountType: resolvedAccountType,
                  email,
                  password,
                  ...(mode === "signup" ? { fullName } : {}),
                  ...(companyName ? { companyName } : {}),
                  ...(phone ? { phone } : {}),
                  ...(marketingEmailsConsent !== undefined
                    ? { marketingEmailsConsent }
                    : {}),
                  ...(rememberMe !== undefined ? { rememberMe } : {}),
                };

                await onSubmit?.(payload);
              }}
            >
              {mode === "signup" && (
                <div className="animate-delay-250 animate-element space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    {accountTypeLabel}
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-foreground/5 p-1 backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => setAccountType("developer")}
                      className={[
                        "rounded-xl py-2 text-sm font-semibold transition-colors",
                        resolvedAccountType === "developer"
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-foreground/5",
                      ].join(" ")}
                    >
                      {accountTypeDeveloper}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccountType("partner")}
                      className={[
                        "rounded-xl py-2 text-sm font-semibold transition-colors",
                        resolvedAccountType === "partner"
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-foreground/5",
                      ].join(" ")}
                    >
                      {accountTypePartner}
                    </button>
                  </div>
                </div>
              )}

              {mode === "signup" && (
                <div className="animate-delay-300 animate-element">
                  <label className="text-sm font-medium text-muted-foreground">
                    {fullNameLabel}
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="fullName"
                      type="text"
                      placeholder={fullNamePlaceholder}
                      className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm focus:outline-none"
                      autoComplete="name"
                      required
                    />
                  </GlassInputWrapper>
                </div>
              )}

              {mode === "signup" && resolvedAccountType === "developer" && (
                <div className="animate-delay-320 animate-element">
                  <label className="text-sm font-medium text-muted-foreground">
                    {companyNameLabel}
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="companyName"
                      type="text"
                      placeholder={companyNamePlaceholder}
                      className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm focus:outline-none"
                      autoComplete="organization"
                    />
                  </GlassInputWrapper>
                </div>
              )}

              {mode === "signup" && (
                <div className="animate-delay-340 animate-element">
                  <label className="text-sm font-medium text-muted-foreground">
                    {phoneLabel}
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="phone"
                      type="tel"
                      placeholder={phonePlaceholder}
                      className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm focus:outline-none"
                      autoComplete="tel"
                    />
                  </GlassInputWrapper>
                </div>
              )}

              <div className="animate-delay-360 animate-element">
                <label className="text-sm font-medium text-muted-foreground">
                  {emailLabel}
                </label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder={emailPlaceholder}
                    className="w-full rounded-2xl bg-transparent px-4 py-3 text-sm focus:outline-none"
                    autoComplete="email"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-delay-400 animate-element">
                <label className="text-sm font-medium text-muted-foreground">
                  {passwordLabel}
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={passwordPlaceholder}
                      className="w-full rounded-2xl bg-transparent px-4 py-3 pr-12 text-sm focus:outline-none"
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground transition-colors hover:text-foreground" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {/*  {mode === "signup" && oauthBlock} */}

              {mode === "signup" ? (
                <div className="animate-delay-500 flex animate-element flex-col gap-3 text-sm">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name="privacyOfferAgreement"
                      className="custom-checkbox mt-0.5"
                      required
                    />
                    <span className="text-foreground/90">
                      {privacyOfferAgreement}
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      name="marketingEmailsConsent"
                      className="custom-checkbox mt-0.5"
                    />
                    <span className="text-foreground/90">
                      {marketingEmailsConsent}
                    </span>
                  </label>
                </div>
              ) : (
                <div className="animate-delay-500 flex animate-element items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      className="custom-checkbox"
                    />
                    <span className="text-foreground/90">{rememberMe}</span>
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onResetPassword?.();
                    }}
                    className="text-[var(--admin-primary)] transition-colors hover:underline"
                  >
                    {resetPassword}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="animate-delay-600 w-full animate-element rounded-2xl bg-[var(--admin-primary)] py-4 font-medium text-[var(--admin-text-on-primary)] transition-colors hover:bg-[var(--admin-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mode === "signin" ? signInButton : signUpButton}
              </button>
            </form>

            {mode === "signin" && oauthBlock}

            <p
              key={`auth-mode-link-${mode}`}
              className="animate-delay-900 animate-element text-center text-sm text-muted-foreground"
            >
              {mode === "signin"
                ? createAccountPrompt
                : alreadyHaveAccountPrompt}{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const nextMode = mode === "signin" ? "signup" : "signin";
                  if (onModeChange) {
                    onModeChange(nextMode);
                    return;
                  }
                  setMode(nextMode);
                }}
                className="text-[var(--admin-primary)] transition-colors hover:underline"
              >
                {mode === "signin" ? createAccountLink : alreadyHaveAccountLink}
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero video (async) / image fallback + testimonials */}
      {heroImageSrc && (
        <section className="relative hidden flex-1 p-4 md:block">
          <div className="fixed bottom-4 top-4 w-[calc(50vw-24px)] [inset-inline-start:calc(50vw+8px)]">
            {/* Fallback/initial background */}
            <div
              className="animate-delay-300 relative h-full w-full animate-slide-right rounded-3xl bg-cover bg-center"
              style={{ backgroundImage: `url(${heroImageSrc})` }}
            >
              <video
                ref={videoRef}
                src={heroVideoSrc}
                className={`absolute inset-0 h-full w-full rounded-3xl object-cover transition-opacity duration-700 ${videoReady ? "opacity-100" : "opacity-0"}`}
                loop
                muted
                playsInline
                disablePictureInPicture
                onCanPlay={() => setVideoReady(true)}
                aria-hidden
              />
            </div>

            {/* Video loads async and fades in when ready */}

            {testimonials.length > 0 && testimonials[0] && (
              <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
                <TestimonialCard
                  testimonial={testimonials[0]}
                  delay="animate-delay-1000"
                />
                {testimonials[1] && (
                  <div className="hidden xl:flex">
                    <TestimonialCard
                      testimonial={testimonials[1]}
                      delay="animate-delay-1200"
                    />
                  </div>
                )}
                {testimonials[2] && (
                  <div className="hidden 2xl:flex">
                    <TestimonialCard
                      testimonial={testimonials[2]}
                      delay="animate-delay-1400"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
