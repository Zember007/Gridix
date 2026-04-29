import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
} from "@gridix/ui";
import { AlertTriangle } from "lucide-react";
import { useLanguage } from "@gridix/utils/react";
import { deactivateGenplan } from "../api/genplanApi";
import type { SubProject } from "../model/types";
import { toast } from "sonner";

interface DeactivateGenplanModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  subProjects: SubProject[];
  onDeactivated: () => void;
}

export function DeactivateGenplanModal({
  open,
  onClose,
  projectId,
  subProjects,
  onDeactivated,
}: DeactivateGenplanModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [keepSubProjectId, setKeepSubProjectId] = useState("");

  const orderedSubProjects = useMemo(
    () => [...subProjects].sort((a, b) => a.sort_order - b.sort_order),
    [subProjects],
  );

  const multiSub = orderedSubProjects.length > 1;

  useEffect(() => {
    if (!open || orderedSubProjects.length === 0) return;
    const def =
      orderedSubProjects.find((s) => s.is_default) ?? orderedSubProjects[0];
    setKeepSubProjectId(def?.id ?? "");
  }, [open, orderedSubProjects]);

  const handleDeactivate = async () => {
    if (multiSub && !keepSubProjectId) {
      toast.error(t("genplan.deactivate.pickKeepError"));
      return;
    }
    setLoading(true);
    try {
      await deactivateGenplan(
        projectId,
        multiSub ? { keepSubProjectId } : undefined,
      );
      toast.success(t("genplan.deactivate.success"));
      onDeactivated();
      onClose();
    } catch {
      toast.error(t("genplan.deactivate.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <DialogTitle>{t("genplan.deactivate.title")}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {multiSub
                  ? t("genplan.deactivate.multiDescription")
                  : t("genplan.deactivate.description")}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {multiSub && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t("genplan.deactivate.pickKeepLabel")}
            </Label>
            <RadioGroup
              value={keepSubProjectId}
              onValueChange={setKeepSubProjectId}
              className="gap-2"
            >
              {orderedSubProjects.map((sp) => (
                <label
                  key={sp.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm has-[[data-state=checked]]:border-primary"
                >
                  <RadioGroupItem
                    value={sp.id}
                    id={`deactivate-keep-${sp.id}`}
                  />
                  <span className="font-medium leading-tight">{sp.name}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        )}

        <div
          className={
            multiSub
              ? "rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
              : "rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800"
          }
        >
          {multiSub
            ? t("genplan.deactivate.othersDeletedWarning")
            : t("genplan.deactivate.warning")}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={loading || (multiSub && !keepSubProjectId)}
          >
            {loading ? t("common.saving") : t("genplan.deactivate.button")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
