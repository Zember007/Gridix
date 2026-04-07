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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { createSubProject } from "../api/genplanApi";
import type { SubProject } from "../model/types";
import { toast } from "sonner";

interface SubProjectCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: (subProject: SubProject) => void;
}

export function SubProjectCreateModal({
  open,
  onClose,
  projectId,
  onCreated,
}: SubProjectCreateModalProps) {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [type, setType] = useState<"building" | "object">("building");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const sp = await createSubProject(projectId, {
        name: name.trim(),
        type,
      });
      toast.success(t("genplan.subProjects.createSuccess"));
      onCreated(sp);
      setName("");
      onClose();
    } catch {
      toast.error(t("genplan.subProjects.createError"));
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
          <DialogTitle>{t("genplan.subProjects.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t("genplan.subProjects.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("genplan.subProjects.namePlaceholder")}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("genplan.subProjects.type")}</Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as "building" | "object")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="building">
                  {t("genplan.subProjects.typeBuilding")}
                </SelectItem>
                <SelectItem value="object">
                  {t("genplan.subProjects.typeObject")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
