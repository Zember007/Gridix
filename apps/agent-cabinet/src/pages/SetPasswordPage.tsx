import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@gridix/ui";
import { toast } from "sonner";
import { supabase } from "@gridix/utils/api";
import { addLanguageToPath } from "@gridix/utils/lib";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SetPasswordPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [sp] = useSearchParams();
  const navigate = useNavigate();

  const nextRaw = sp.get("next") || "/";
  const nextPath = useMemo(() => {
    try {
      // next is expected to be a path without language prefix (e.g. "/projects?x=1").
      return typeof nextRaw === "string" && nextRaw.startsWith("/") ? nextRaw : "/";
    } catch {
      return "/";
    }
  }, [nextRaw]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-black">{t("common.auth.setPasswordTitle") ?? "Set password"}</CardTitle>
          <CardDescription>
            {t("common.auth.setPasswordDescription") ??
              "Your password is not set yet. Please create a password to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{t("common.auth.password") ?? "Password"}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">{t("common.auth.confirmPassword") ?? "Confirm password"}</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              if (!user?.id) return;
              if (!password || password.length < 8) {
                toast.error("Password must be at least 8 characters.");
                return;
              }
              if (password !== confirm) {
                toast.error("Passwords do not match.");
                return;
              }
              try {
                setLoading(true);
                const { error: authErr } = await supabase.auth.updateUser({ password });
                if (authErr) throw authErr;

                // Password presence is now detected via RPC check_if_user_has_password().
                // Keep password_set_at update as a best-effort compatibility field (non-blocking).
                await supabase
                  .from("user_profiles")
                  .update({ password_set_at: new Date().toISOString() })
                  .eq("id", user.id)
                  .throwOnError()
                  .catch(() => null);

                toast.success("Password updated");
                navigate(addLanguageToPath(nextPath, language), { replace: true });
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || "Failed to update password");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t("common.common.loading") : t("common.auth.savePassword") ?? "Save password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

