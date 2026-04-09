import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { MapTrifold } from "@phosphor-icons/react";
import { useLanguage } from "@gridix/utils/react";
import { activateGenplan } from "../api/genplanApi";
import { toast } from "sonner";

interface ActivateGenplanModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onActivated: () => void;
}

export function ActivateGenplanModal({
  open,
  onClose,
  projectId,
  onActivated,
}: ActivateGenplanModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
      await activateGenplan(projectId);
      toast.success(t("genplan.activate.success"));
      onActivated();
      onClose();
    } catch {
      toast.error(t("genplan.activate.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <MapTrifold size={20} className="text-primary" />
            </div>
            <div>
              <DialogTitle>{t("genplan.activate.title")}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {t("genplan.activate.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          {t("genplan.activate.hint")}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleActivate} disabled={loading}>
            {loading ? t("common.saving") : t("genplan.activate.button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
