import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
export default function AuthPage() {
  const { t } = useLanguage();
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
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
              children: t("common.app.title"),
            }),
            _jsx(CardDescription, { children: t("common.auth.sendLink") }),
          ],
        }),
        _jsxs(CardContent, {
          className: "space-y-4",
          children: [
            _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsx(Label, {
                  htmlFor: "email",
                  children: t("common.auth.email"),
                }),
                _jsx(Input, {
                  id: "email",
                  type: "email",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                }),
              ],
            }),
            _jsx(Button, {
              className: "w-full",
              disabled: loading,
              onClick: async () => {
                const cleaned = email.trim();
                if (!cleaned) {
                  toast.error(t("common.errors.emailRequired"));
                  return;
                }
                try {
                  setLoading(true);
                  await signInWithOtp(cleaned);
                  toast.success(t("common.auth.checkEmailTitle"), {
                    description: t("common.auth.magicLinkSent"),
                  });
                } catch (e) {
                  console.error(e);
                  toast.error(
                    e?.message || t("common.errors.failedToSendLink"),
                  );
                } finally {
                  setLoading(false);
                }
              },
              children: loading
                ? t("common.common.loading")
                : t("common.auth.sendLink"),
            }),
          ],
        }),
      ],
    }),
  });
}
