import { useEffect, useMemo, useState } from "react";
import { Button } from "@gridix/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gridix/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@gridix/ui";
import { Switch } from "@gridix/ui";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  disableProjectAmoSettings,
  saveProjectAmoSettings,
} from "../api/amocrm-project-config-api";
import type { AmoCRMProjectRowProps } from "../model/types";

export const AmoCRMProjectRow = ({
  project,
  connection,
  amoData,
  settings,
  refreshSettings,
}: AmoCRMProjectRowProps) => {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(
    null,
  );
  const [selectedStatusId, setSelectedStatusId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isActive = !!settings?.id;

  useEffect(() => {
    if (settings) {
      setSelectedPipelineId(settings.pipeline_id?.toString() ?? null);
      setSelectedStatusId(settings.status_id?.toString() ?? null);
      setSelectedUserId(settings.responsible_user_id?.toString() ?? null);
    } else {
      setSelectedPipelineId(null);
      setSelectedStatusId(null);
      setSelectedUserId(null);
    }
  }, [
    settings,
    settings?.id,
    settings?.pipeline_id,
    settings?.status_id,
    settings?.responsible_user_id,
  ]);

  const handleToggleActivation = async (enabled: boolean) => {
    setSaving(true);
    try {
      if (enabled) {
        setIsModalOpen(true);
      } else {
        await disableProjectAmoSettings(connection.id, project.id);
        toast.success(t("amocrm.disabled"));
        await refreshSettings();
      }
    } catch (error) {
      console.error(error);
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPipelineId) {
      toast.error(t("amocrm.selectPipelineRequired"));
      return;
    }

    setSaving(true);
    try {
      const result = await saveProjectAmoSettings({
        projectId: project.id,
        pipelineId: selectedPipelineId,
        statusId: selectedStatusId,
        responsibleUserId: selectedUserId,
      });

      if ((result as any)?.success) {
        toast.success(t("amocrm.settingsSaveSuccess"));
        await refreshSettings();
        setIsModalOpen(false);
      } else {
        throw new Error((result as any)?.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("amocrm.settingsSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const statuses = useMemo(
    () =>
      amoData?.pipelines.find((p) => p.id.toString() === selectedPipelineId)
        ?.statuses || [],
    [amoData, selectedPipelineId],
  );

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5">
      <div className="flex flex-1 items-center gap-4">
        <Switch
          checked={isActive}
          onCheckedChange={handleToggleActivation}
          disabled={saving}
        />
        <div className="flex flex-col">
          <span className="mb-1 text-sm font-medium leading-none">
            {project.name}
          </span>
          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="text-[10px] font-medium text-green-600">
                Active
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Dialog
          open={isModalOpen}
          onOpenChange={(open) => {
            setIsModalOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              disabled={!isActive}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{project.name}</DialogTitle>
              <DialogDescription>
                {t("amocrm.configureProjectDesc")}
              </DialogDescription>
            </DialogHeader>

            {!amoData ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4 py-4 text-left">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("amocrm.pipeline")}
                  </label>
                  <Select
                    value={selectedPipelineId || ""}
                    onValueChange={(v) => {
                      setSelectedPipelineId(v);
                      setSelectedStatusId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("amocrm.selectPipeline")} />
                    </SelectTrigger>
                    <SelectContent>
                      {amoData.pipelines.map((pipeline) => (
                        <SelectItem
                          key={pipeline.id}
                          value={pipeline.id.toString()}
                        >
                          {pipeline.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("amocrm.responsible")}
                  </label>
                  <Select
                    value={selectedUserId || "none"}
                    onValueChange={(v) =>
                      setSelectedUserId(v === "none" ? null : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("amocrm.selectResponsible")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        {t("amocrm.notSelected")}
                      </SelectItem>
                      {amoData.users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !selectedPipelineId || !amoData}
                className="bg-[#4c8bf7] hover:bg-[#3b72d1]"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
