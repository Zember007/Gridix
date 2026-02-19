import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
  return _jsx("div", {
    className: "flex min-h-screen items-center justify-center bg-slate-50 p-4",
    children: _jsxs(Card, {
      className: "w-full max-w-md border-none bg-white shadow-xl",
      children: [
        _jsxs(CardHeader, {
          children: [
            _jsx(CardTitle, {
              className: "text-2xl font-black",
              children: t("common.auth.setPasswordTitle"),
            }),
            _jsx(CardDescription, {
              children: t("common.auth.setPasswordDescription"),
            }),
          ],
        }),
        _jsxs(CardContent, {
          className: "space-y-4",
          children: [
            _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsx(Label, {
                  htmlFor: "password",
                  children: t("common.auth.password"),
                }),
                _jsx(Input, {
                  id: "password",
                  type: "password",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  placeholder:
                    "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                }),
              ],
            }),
            _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsx(Label, {
                  htmlFor: "confirm",
                  children: t("common.auth.confirmPassword"),
                }),
                _jsx(Input, {
                  id: "confirm",
                  type: "password",
                  value: confirm,
                  onChange: (e) => setConfirm(e.target.value),
                  placeholder:
                    "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
                }),
              ],
            }),
            _jsx(Button, {
              className: "w-full",
              disabled: loading,
              onClick: async () => {
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
                  // Password presence is now detected via RPC check_if_user_has_password().
                  // Keep password_set_at update as a best-effort compatibility field (non-blocking).
                  try {
                    await supabase
                      .from("user_profiles")
                      .update({ password_set_at: new Date().toISOString() })
                      .eq("id", user.id);
                  } catch {
                    // ignore (best-effort)
                  }
                  toast.success(t("common.auth.passwordUpdated"));
                  navigate(addLanguageToPath(nextPath, language), {
                    replace: true,
                  });
                } catch (e) {
                  console.error(e);
                  toast.error(
                    e?.message || t("common.errors.failedToUpdatePassword"),
                  );
                } finally {
                  setLoading(false);
                }
              },
              children: loading
                ? t("common.common.loading")
                : t("common.auth.savePassword"),
            }),
          ],
        }),
      ],
    }),
  });
}
