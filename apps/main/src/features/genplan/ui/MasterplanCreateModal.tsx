import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { upsertMasterplan } from "../api/genplanApi";
import { toast } from "sonner";

interface MasterplanCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  masterplanCount: number;
  onCreated: (masterplanId: string) => void;
}

export function MasterplanCreateModal({
  open,
  onClose,
  projectId,
  masterplanCount,
  onCreated,
}: MasterplanCreateModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const defaultName = `${t("genplan.editor.title")} ${masterplanCount + 1}`;

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { masterplanId } = await upsertMasterplan(projectId, {
        name: name.trim() || defaultName,
        is_default: false,
      });
      toast.success(t("genplan.editor.masterplanCreated"));
      setName("");
      onCreated(masterplanId);
      onClose();
    } catch {
      toast.error(t("genplan.editor.masterplanCreateError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setName("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("genplan.editor.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("genplan.editor.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={defaultName}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
