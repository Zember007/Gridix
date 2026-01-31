import { useState } from "react";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@gridix/ui";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AuthPage() {
  const { t } = useLanguage();
  const { signInWithOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-xl bg-white">
        <CardHeader>
          <CardTitle className="text-2xl font-black">{t("common.app.title")}</CardTitle>
          <CardDescription>{t("common.auth.sendLink")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("common.auth.email")}</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={loading}
            onClick={async () => {
              try {
                setLoading(true);
                await signInWithOtp(email);
                toast.success("Check your email", { description: "Magic link has been sent." });
              } catch (e: any) {
                console.error(e);
                toast.error(e?.message || "Failed to send link");
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

