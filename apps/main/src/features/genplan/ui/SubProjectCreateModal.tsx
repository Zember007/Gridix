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
  Tabs,
  TabsList,
  TabsTrigger,
} from "@gridix/ui";
import { useLanguage } from "@gridix/utils/react";
import { createSubProject, cloneSubProject } from "../api/genplanApi";
import type { SubProject } from "../model/types";
import { toast } from "sonner";

type Mode = "empty" | "clone";

interface SubProjectCreateModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: (subProject: SubProject) => void;
  subProjects?: SubProject[];
}

export function SubProjectCreateModal({
  open,
  onClose,
  projectId,
  onCreated,
  subProjects = [],
}: SubProjectCreateModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("empty");
  const [name, setName] = useState("");
  const [type, setType] = useState<"building" | "object">("building");
  const [sourceId, setSourceId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setType("building");
    setSourceId("");
    setMode("empty");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (mode === "empty") {
      if (!name.trim()) return;
      setLoading(true);
      try {
        const sp = await createSubProject(projectId, {
          name: name.trim(),
          type,
        });
        toast.success(t("genplan.subProjects.createSuccess"));
        onCreated(sp);
        handleClose();
      } catch {
        toast.error(t("genplan.subProjects.createError"));
      } finally {
        setLoading(false);
      }
    } else {
      if (!sourceId) return;
      setLoading(true);
      try {
        const sp = await cloneSubProject(projectId, {
          sourceSubProjectId: sourceId,
          name: name.trim() || undefined,
          type,
        });
        toast.success(t("genplan.subProjects.cloneSuccess"));
        onCreated(sp);
        handleClose();
      } catch {
        toast.error(t("genplan.subProjects.cloneError"));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSourceChange = (id: string) => {
    setSourceId(id);
    const source = subProjects.find((sp) => sp.id === id);
    if (source) {
      if (!name.trim())
        setName(
          `${source.name} (${t("genplan.subProjects.cloneModeFromExisting").toLowerCase()})`,
        );
      setType((source.type as "building" | "object") ?? "building");
    }
  };

  const canSubmit = mode === "empty" ? !!name.trim() : !!sourceId;

  const hasCloneSources = subProjects.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {mode === "clone"
              ? t("genplan.subProjects.cloneTitle")
              : t("genplan.subProjects.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {hasCloneSources && (
            <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="empty">
                  {t("genplan.subProjects.cloneModeEmpty")}
                </TabsTrigger>
                <TabsTrigger value="clone">
                  {t("genplan.subProjects.cloneModeFromExisting")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {mode === "clone" && (
            <div className="space-y-1.5">
              <Label>{t("genplan.subProjects.cloneSourceLabel")}</Label>
              <Select value={sourceId} onValueChange={handleSourceChange}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "genplan.subProjects.cloneSourcePlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {subProjects.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{t("genplan.subProjects.name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("genplan.subProjects.namePlaceholder")}
              onKeyDown={(e) =>
                e.key === "Enter" && canSubmit && handleCreate()
              }
              autoFocus={mode === "empty"}
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
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleCreate} disabled={loading || !canSubmit}>
            {loading
              ? mode === "clone"
                ? t("genplan.subProjects.cloning")
                : t("common.saving")
              : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
