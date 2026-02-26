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
import { useAuth } from "@/features/auth-session";
import { useLanguage } from "@/shared/lib/language";

export function AuthRequestLinkScreen() {
  const { t } = useLanguage();
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none bg-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-black">
            {t("common.app.title")}
          </CardTitle>
          <CardDescription>{t("common.auth.sendLink")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
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
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || t("common.errors.failedToSendLink"));
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? t("common.common.loading") : t("common.auth.sendLink")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
