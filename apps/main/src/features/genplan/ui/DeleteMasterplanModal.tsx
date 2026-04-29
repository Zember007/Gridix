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
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { deleteMasterplan } from "../api/genplanApi";
import { toast } from "sonner";

interface DeleteMasterplanModalProps {
  open: boolean;
  onClose: () => void;
  masterplanId: string;
  masterplanName: string;
  onDeleted: () => void;
}

export function DeleteMasterplanModal({
  open,
  onClose,
  masterplanId,
  masterplanName,
  onDeleted,
}: DeleteMasterplanModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteMasterplan(masterplanId);
      toast.success(t("genplan.editor.deleteMasterplanSuccess"));
      onDeleted();
      onClose();
    } catch {
      toast.error(t("genplan.editor.deleteMasterplanError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>
                {t("genplan.editor.deleteMasterplanTitle")}
              </DialogTitle>
              <DialogDescription className="mt-0.5">
                {masterplanName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {t("genplan.editor.deleteMasterplanWarning")}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading
              ? t("common.saving")
              : t("genplan.editor.deleteMasterplan")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
