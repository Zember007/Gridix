import { Button } from "@gridix/ui/button";
import { Input } from "@gridix/ui/input";
import { Label } from "@gridix/ui/label";

interface ResetPasswordDialogProps {
  t: (key: string) => string;
  resetEmail: string;
  resetLoading: boolean;
  onEmailChange: (email: string) => void;
  onClose: () => void;
  onSend: () => void;
}

export const ResetPasswordDialog = ({
  t,
  resetEmail,
  resetLoading,
  onEmailChange,
  onClose,
  onSend,
}: ResetPasswordDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-background shadow-lg">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">
            {t("auth.resetPasswordTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.resetPasswordDescription")}
          </p>
        </div>
        <div className="space-y-4 p-6">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t("auth.resetEmail")}</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={resetEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              {t("auth.cancel")}
            </Button>
            <Button type="button" onClick={onSend} disabled={resetLoading}>
              {resetLoading ? t("auth.sending") : t("auth.sendLink")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
