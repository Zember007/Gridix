import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

type AuthMode = "signin" | "signup";

export interface AuthFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  defaultMode?: AuthMode | undefined;
}

export interface PartnerInfo {
  id: string;
  partner_code: string;
  user_profiles: {
    full_name: string | null;
    email: string | null;
  };
}

export interface AuthFormData {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  phone: string;
}

export const useAuthFormController = ({
  onSuccess,
  redirectTo,
  defaultMode,
}: AuthFormProps) => {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>(defaultMode || "signin");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [marketingEmailsConsent, setMarketingEmailsConsent] = useState(false);
  const [checkingPartner, setCheckingPartner] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    phone: "",
  });

  const refCode = searchParams.get("ref");
  const inviteCode = searchParams.get("invite");

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

        setPartnerInfo(data);
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
              account_type: "developer",
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
              });

            if (linkError) {
              console.error("Error creating partner link:", linkError);
            }
          }

          if (inviteCode) {
            const { error: inviteError } = await supabase
              .from("partner_invitations")
              .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
              })
              .eq("invitation_code", inviteCode)
              .eq("email", formData.email);

            if (inviteError) {
              console.error("Error updating invitation:", inviteError);
            }
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
    } catch (error) {
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
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/en/set-password`,
      });
      if (error) throw error;
      toast.success(t("auth.resetEmailSent"));
      setShowReset(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("auth.failedToSendEmail");
      console.error("Reset email error:", err);
      toast.error(message);
    } finally {
      setResetLoading(false);
    }
  };

  // Preserved for parity with previous implementation.
  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectTo || window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.googleAuthError");
      console.error("Google auth error:", error);
      toast.error(message);
    }
  };

  return {
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
    setMode,
    setShowPassword,
    setResetEmail,
    setShowReset,
    setFormData,
    setMarketingEmailsConsent,
    handleSubmit,
    handleSendReset,
    handleGoogleAuth,
  };
};
