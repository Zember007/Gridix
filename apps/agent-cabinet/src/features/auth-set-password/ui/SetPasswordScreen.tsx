import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@gridix/ui";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { addLanguageToPath } from "@gridix/utils/lib";
import { useAuth } from "@/shared/lib/auth";
import { useLanguage } from "@/shared/lib/language";

export function SetPasswordScreen() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const nextRaw = sp.get("next") || "/";
  const nextPath = useMemo(() => {
    try {
      return typeof nextRaw === "string" && nextRaw.startsWith("/")
        ? nextRaw
        : "/";
    } catch {
      return "/";
    }
  }, [nextRaw]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none bg-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-black">
            {t("common.auth.setPasswordTitle")}
          </CardTitle>
          <CardDescription>
            {t("common.auth.setPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("common.auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">{t("common.auth.confirmPassword")}</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="********"
            />
          </div>

          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              if (!user?.id) return;
              if (!password || password.length < 8) {
                toast.error(t("common.errors.passwordMinLength"));
                return;
              }
              if (password !== confirm) {
                toast.error(t("common.errors.passwordsDontMatch"));
                return;
              }
              try {
                setLoading(true);
                const { error: authErr } = await supabase.auth.updateUser({
                  password,
                  data: { requires_password_setup: false },
                });
                if (authErr) throw authErr;

                try {
                  await supabase
                    .from("user_profiles")
                    .update({ password_set_at: new Date().toISOString() })
                    .eq("id", user.id);
                } catch {
                  // best-effort compatibility field
                }

                toast.success(t("common.auth.passwordUpdated"));
                navigate(addLanguageToPath(nextPath, language), {
                  replace: true,
                });
              } catch (e: any) {
                console.error(e);
                toast.error(
                  e?.message || t("common.errors.failedToUpdatePassword"),
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading
              ? t("common.common.loading")
              : t("common.auth.savePassword")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
