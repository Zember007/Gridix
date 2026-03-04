import { useState } from "react";
import { supabase } from "@gridix/utils/api";
import { toast } from "sonner";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { Input } from "./input";
import { Label } from "./label";

interface SetPasswordTexts {
  title: string;
  description: string;
  passwordLabel: string;
  confirmPasswordLabel: string;
  passwordMinLengthError: string;
  passwordsDontMatchError: string;
  passwordUpdatedSuccess: string;
  failedToUpdatePassword: string;
  loadingLabel: string;
  savePasswordLabel: string;
}

interface SetPasswordPageProps {
  userId: string | undefined;
  texts: SetPasswordTexts;
  onSuccess: () => void;
}

export const SetPasswordPage = ({
  userId,
  texts,
  onSuccess,
}: SetPasswordPageProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSavePassword = async () => {
    if (!password || password.length < 8) {
      toast.error(texts.passwordMinLengthError);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(texts.passwordsDontMatchError);
      return;
    }

    try {
      setLoading(true);

      const { error: authError } = await supabase.auth.updateUser({
        password,
        data: { requires_password_setup: false },
      });
      if (authError) {
        throw authError;
      }

      if (userId) {
        try {
          await supabase
            .from("user_profiles")
            .update({ password_set_at: new Date().toISOString() })
            .eq("id", userId);
        } catch {
          // best-effort profile compatibility update
        }
      }

      toast.success(texts.passwordUpdatedSuccess);
      onSuccess();
    } catch (error: unknown) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : texts.failedToUpdatePassword;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-none bg-white shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-black">{texts.title}</CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">{texts.passwordLabel}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {texts.confirmPasswordLabel}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            className="w-full"
            disabled={loading}
            onClick={handleSavePassword}
          >
            {loading ? texts.loadingLabel : texts.savePasswordLabel}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
