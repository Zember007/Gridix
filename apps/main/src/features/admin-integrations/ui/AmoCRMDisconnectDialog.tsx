import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { RefreshCw } from "lucide-react";

type AmoCRMDisconnectDialogProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  onDisconnect: () => void;
  disconnecting: boolean;
  t: (key: string) => string;
};

export const AmoCRMDisconnectDialog = ({
  open,
  onOpenChange,
  onDisconnect,
  disconnecting,
  t,
}: AmoCRMDisconnectDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("amocrm.disconnectWarningTitle")}</DialogTitle>
          <DialogDescription>
            {t("amocrm.disconnectWarningMessage")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={onDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              t("admin.amocrm.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
