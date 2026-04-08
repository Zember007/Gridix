import { useEffect, useState } from "react";
import { supabase } from "@gridix/utils/api";
import { useLanguage, useLanguageNavigation } from "@gridix/utils/react";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { Button } from "@gridix/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function CheckEmailPage() {
  const { t } = useLanguage();
  const { navigate } = useLanguageNavigation();
  const [email, setEmail] = useState("");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("gridix_pending_email") ?? "";
      setEmail(stored);
      sessionStorage.removeItem("gridix_pending_email");
    } catch {
      // storage unavailable
    }
  }, []);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  const handleResend = async () => {
    if (!email || cooldown) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success(t("auth.resendEmailSent"));
      setCooldown(true);
      setTimeout(() => setCooldown(false), 60_000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.errorOccurred"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center bg-slate-50 p-6">
      <div className="absolute right-4 top-4 z-50 md:right-8 md:top-8">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-5">
            <MailCheck className="h-14 w-14 text-green-600" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-slate-900">
            {t("auth.checkEmailTitle")}
          </h1>
          {email && (
            <p className="text-muted-foreground">
              {t("auth.checkEmailSentTo")}{" "}
              <span className="font-semibold text-slate-800">{email}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {t("auth.checkEmailInstruction")}
          </p>
        </div>

        {email && (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resending || cooldown}
            loading={resending}
            className="w-full"
          >
            {cooldown ? t("auth.resendEmailCooldown") : t("auth.resendEmail")}
          </Button>
        )}

        <button
          type="button"
          onClick={() => navigate("/auth/signin")}
          className="block w-full text-center text-sm text-muted-foreground transition-colors hover:text-slate-900 hover:underline"
        >
          {t("auth.backToSignIn")}
        </button>
      </div>
    </div>
  );
}
