import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@gridix/utils/api";
import {
  consumeSupabaseSessionFromUrl,
  fetchCurrentSession,
} from "@gridix/utils";
import { toast } from "sonner";
import { useLanguageNavigation, useLanguage } from "@gridix/utils/react";
import { FullPageLoaderView } from "@/shared/ui/LoaderView";
import { redirectToAppByAccountType } from "@/shared/lib/redirectByAccountType";
import type { AccountType } from "@/components/ui/sign-in";
import { SignInPage } from "@/components/ui/sign-in";

const SIGNIN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80";

export default function CompleteProfilePage() {
  const { navigate } = useLanguageNavigation();
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const redirectToUrl = searchParams.get("redirect_to");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("developer");
  const [sessionUser, setSessionUser] = useState<any>(null);

  const lang = window.location.pathname.split("/")[1] || "en";

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await consumeSupabaseSessionFromUrl(supabase);
        const { session } = await fetchCurrentSession();
        if (!session?.user?.id) {
          if (mounted) navigate("/auth/signin");
          return;
        }

        const { data: profile } = await supabase
          .from("user_profiles")
          .select("id, account_type, full_name, company_name")
          .eq("id", session.user.id)
          .maybeSingle();

        // If profile exists and is fully fleshed out, get out of here immediately
        if (
          profile?.account_type &&
          profile?.full_name &&
          (profile?.account_type !== "developer" || profile?.company_name)
        ) {
          await redirectToAppByAccountType(supabase, session, {
            redirectToUrl: redirectToUrl ?? null,
            lang,
          });
          return;
        }

        if (mounted) {
          setSessionUser(session.user);
          setLoading(false);
        }
      } catch (err) {
        console.error("Complete Profile initial load failed:", err);
        if (mounted) navigate("/auth/signin");
      }
    };
    void init();
    return () => {
      mounted = false;
    };
  }, [lang, navigate, redirectToUrl]);

  if (loading) return <FullPageLoaderView />;

  return (
    <div className="min-h-screen bg-slate-50 pt-16 md:pt-20 lg:pt-8">
      <SignInPage
        defaultMode="signup"
        heroImageSrc={SIGNIN_HERO_IMAGE}
        accountType={accountType}
        onAccountTypeChange={setAccountType}
        loading={submitting}
        labels={{
          signUpTitle: t("auth.completeProfileTitle", {
            defaultValue: "Complete Your Profile",
          }),
          signUpDescription: t("auth.completeProfileDescription", {
            defaultValue: "Please finish setting up your account to continue.",
          }),
          emailLabel: t("auth.email"),
          emailPlaceholder: sessionUser?.email || t("auth.emailPlaceholder"),
          passwordLabel: t("auth.password"),
          passwordPlaceholder: "***** (OAuth user)",
          fullNameLabel: t("auth.fullName"),
          fullNamePlaceholder:
            sessionUser?.user_metadata?.full_name ||
            t("auth.fullNamePlaceholder"),
          companyNameLabel: t("auth.companyName"),
          companyNamePlaceholder: t("auth.companyNamePlaceholder"),
          phoneLabel: t("auth.phone"),
          phonePlaceholder: t("auth.phonePlaceholder"),
          accountTypeLabel: t("auth.selectAccountType"),
          accountTypeDeveloper: t("auth.developer"),
          accountTypePartner: t("auth.partner"),
          signUpButton: t("auth.continueToApp", { defaultValue: "Continue" }),
        }}
        onSubmit={async (payload) => {
          setSubmitting(true);
          try {
            // Upsert the missing profile data manually
            const { error: patchProfileError } = await supabase
              .from("user_profiles")
              .upsert(
                {
                  id: sessionUser.id,
                  account_type: payload.accountType,
                  full_name: payload.fullName,
                  company_name: payload.companyName,
                  phone: payload.phone,
                },
                { onConflict: "id" },
              );
            if (patchProfileError) throw patchProfileError;

            // Refresh session to grab magic link tokens
            const { session } = await fetchCurrentSession();
            if (session) {
              await redirectToAppByAccountType(supabase, session, {
                redirectToUrl: redirectToUrl ?? null,
                lang,
              });
            } else {
              navigate("/auth/signin");
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Save failed";
            toast.error(message);
          } finally {
            setSubmitting(false);
          }
        }}
      />
    </div>
  );
}
