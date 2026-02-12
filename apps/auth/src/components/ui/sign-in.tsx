import React, { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
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
  onGoogleSignIn?: (payload: { mode: AuthMode; accountType: AccountType }) => void;
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
    marketingEmailsConsent?: string;
    rememberMe?: string;
    resetPassword?: string;
    signInButton?: string;
    signUpButton?: string;
    orContinueWith?: string;
    continueWithGoogle?: string;
    createAccountPrompt?: string;
    createAccountLink?: string;
    alreadyHaveAccountPrompt?: string;
    alreadyHaveAccountLink?: string;
  };
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
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
    className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}
  >
    <img
      src={testimonial.avatarSrc}
      className="h-10 w-10 object-cover rounded-2xl"
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
  const [internalAccountType, setInternalAccountType] = useState<AccountType>("developer");

  const {
    signInTab = "Sign In",
    signUpTab = "Sign Up",
    signInTitle = "Welcome back",
    signUpTitle = "Create your account",
    signInDescription = "Access your account and continue your journey with us",
    signUpDescription = "Create an account to get started",
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
    marketingEmailsConsent = "I agree to receive marketing emails",
    rememberMe = "Keep me signed in",
    resetPassword = "Reset password",
    signInButton = "Sign In",
    signUpButton = "Create account",
    orContinueWith = "Or continue with",
    continueWithGoogle = "Continue with Google",
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
    return (
      <span className="font-light text-foreground tracking-tighter">
        {mode === "signin" ? signInTitle : signUpTitle}
      </span>
    );
  }, [mode, signInTitle, signUpTitle, title]);

  const computedDescription = useMemo(() => {
    if (description != null) return description;
    return mode === "signin" ? signInDescription : signUpDescription;
  }, [description, mode, signInDescription, signUpDescription]);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw]">
      {/* Left column: auth form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              {computedTitle}
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              {computedDescription}
            </p>

            {banner}

            <div className="animate-element animate-delay-250 grid grid-cols-2 gap-2 rounded-2xl border border-border p-1 bg-foreground/5 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={[
                  "rounded-xl py-2 text-sm font-semibold transition-colors",
                  mode === "signin"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-foreground/5",
                ].join(" ")}
              >
                {signInTab}
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={[
                  "rounded-xl py-2 text-sm font-semibold transition-colors",
                  mode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-foreground/5",
                ].join(" ")}
              >
                {signUpTab}
              </button>
            </div>

            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (form.elements.namedItem("email") as HTMLInputElement | null)?.value?.trim() ?? "";
                const password = (form.elements.namedItem("password") as HTMLInputElement | null)?.value ?? "";
                const fullName = (form.elements.namedItem("fullName") as HTMLInputElement | null)?.value?.trim() ?? "";
                const companyName = (form.elements.namedItem("companyName") as HTMLInputElement | null)?.value?.trim() ?? "";
                const phone = (form.elements.namedItem("phone") as HTMLInputElement | null)?.value?.trim() ?? "";
                const marketingEmailsConsent = (form.elements.namedItem("marketingEmailsConsent") as HTMLInputElement | null)?.checked;
                const rememberMe = (form.elements.namedItem("rememberMe") as HTMLInputElement | null)?.checked;

                if (!email || !password) return;
                if (mode === "signup" && !fullName) return;

                const payload: SubmitPayload = {
                  mode,
                  accountType: resolvedAccountType,
                  email,
                  password,
                  ...(mode === "signup" ? { fullName } : {}),
                  ...(companyName ? { companyName } : {}),
                  ...(phone ? { phone } : {}),
                  ...(marketingEmailsConsent !== undefined ? { marketingEmailsConsent } : {}),
                  ...(rememberMe !== undefined ? { rememberMe } : {}),
                };

                await onSubmit?.(payload);
              }}
            >
              {mode === "signup" && (
                <div className="animate-element animate-delay-250 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">{accountTypeLabel}</div>
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border p-1 bg-foreground/5 backdrop-blur-sm">
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
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">
                    {fullNameLabel}
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="fullName"
                      type="text"
                      placeholder={fullNamePlaceholder}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                      autoComplete="name"
                      required
                    />
                  </GlassInputWrapper>
                </div>
              )}

              {mode === "signup" && resolvedAccountType === "developer" && (
                <div className="animate-element animate-delay-320">
                  <label className="text-sm font-medium text-muted-foreground">
                    {companyNameLabel}
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="companyName"
                      type="text"
                      placeholder={companyNamePlaceholder}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                      autoComplete="organization"
                    />
                  </GlassInputWrapper>
                </div>
              )}

              {mode === "signup" && (
                <div className="animate-element animate-delay-340">
                  <label className="text-sm font-medium text-muted-foreground">
                    {phoneLabel}
                  </label>
                  <GlassInputWrapper>
                    <input
                      name="phone"
                      type="tel"
                      placeholder={phonePlaceholder}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                      autoComplete="tel"
                    />
                  </GlassInputWrapper>
                </div>
              )}

              <div className="animate-element animate-delay-360">
                <label className="text-sm font-medium text-muted-foreground">
                  {emailLabel}
                </label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder={emailPlaceholder}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                    autoComplete="email"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">
                  {passwordLabel}
                </label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={passwordPlaceholder}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none"
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {mode === "signup" ? (
                <label className="animate-element animate-delay-500 flex items-start gap-3 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    name="marketingEmailsConsent"
                    className="custom-checkbox mt-0.5"
                  />
                  <span className="text-foreground/90">{marketingEmailsConsent}</span>
                </label>
              ) : (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                    <span className="text-foreground/90">{rememberMe}</span>
                  </label>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onResetPassword?.();
                    }}
                    className="hover:underline text-violet-400 transition-colors"
                  >
                    {resetPassword}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mode === "signin" ? signInButton : signUpButton}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">
                {orContinueWith}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onGoogleSignIn?.({ mode, accountType: resolvedAccountType })}
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
            >
              <GoogleIcon />
              {continueWithGoogle}
            </button>

            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              {mode === "signin" ? createAccountPrompt : alreadyHaveAccountPrompt}{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setMode(mode === "signin" ? "signup" : "signin");
                }}
                className="text-violet-400 hover:underline transition-colors"
              >
                {mode === "signin" ? createAccountLink : alreadyHaveAccountLink}
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          />
          {testimonials.length > 0 && testimonials[0] && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
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
        </section>
      )}
    </div>
  );
};
