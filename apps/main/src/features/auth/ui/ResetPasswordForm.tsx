import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@gridix/ui";
import { Input } from "@gridix/ui";
import { Label } from "@gridix/ui";
import { Button } from "@gridix/ui";
import { toast } from "sonner";
import { supabase } from "@/shared/api/supabase";
import { fetchCurrentSession } from "@gridix/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export const ResetPasswordForm = ({ onSuccess }: ResetPasswordFormProps) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const sessionData = await fetchCurrentSession();
      if (sessionData.session?.user) {
        setIsValidSession(true);
      } else {
        toast.error(t("auth.invalidRecoverySession"));
        // Перенаправляем на страницу входа если нет валидной сессии
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      }
    };

    checkSession();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("auth.passwordsDoNotMatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t("auth.passwordUpdated"));
      onSuccess?.();
    } catch (err: any) {
      console.error("Password update error:", err);
      toast.error(err?.message || t("auth.failedToUpdatePassword"));
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">
                {t("auth.checkingRecoverySession")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl">
            {t("auth.resetPasswordPageTitle")}
          </CardTitle>
          <CardDescription className="text-center">
            {t("auth.resetPasswordPageDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="mt-2 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.newPassword")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("auth.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("auth.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("auth.passwordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("auth.saving") : t("auth.saveNewPassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordForm;
