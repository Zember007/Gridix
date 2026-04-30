import { useEffect, useRef, useState } from "react";
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
import { Skeleton } from "@gridix/ui";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  attachBitrixProject,
  detachBitrixProject,
  fetchBitrixProjectState,
  syncBitrixFunnel,
} from "../api/bitrix24-project-config-api";
import type {
  Bitrix24ProjectRowProps,
  BitrixCategory,
  BitrixStage,
  ProjectBitrixSettings,
} from "../model/types";

export const Bitrix24ProjectRow = ({
  project,
  connection,
}: Bitrix24ProjectRowProps) => {
  const { t } = useLanguage();
  const [projectSettings, setProjectSettings] =
    useState<ProjectBitrixSettings | null>(null);
  const [categories, setCategories] = useState<BitrixCategory[]>([]);
  const [stages, setStages] = useState<BitrixStage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const syncTimeoutRef = useRef<number | null>(null);
  const isConnected = !!projectSettings;

  const fetchState = async () => {
    setLoadingData(true);
    try {
      const state = await fetchBitrixProjectState(project.id);
      setProjectSettings(state.projectSettings);
      setCategories(Array.isArray(state.categories) ? state.categories : []);
      setStages(Array.isArray(state.stages) ? state.stages : []);
      setSelectedCategoryId(state.projectSettings?.category_id ?? null);
    } catch (error) {
      console.error("Error fetching Bitrix state:", error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    void fetchState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const attachToProject = async () => {
    setBusy(true);
    try {
      await attachBitrixProject(project.id);
      toast.success(t("admin.bitrix24.attached"));
      await fetchState();
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
      toast.error(t("admin.bitrix24.attachError"));
    } finally {
      setBusy(false);
    }
  };

  const detachFromProject = async () => {
    setBusy(true);
    try {
      await detachBitrixProject(project.id);
      setProjectSettings(null);
      setCategories([]);
      setStages([]);
      setSelectedCategoryId(null);
      toast.success(t("admin.bitrix24.detached"));
    } catch (error) {
      console.error(error);
      toast.error(t("admin.bitrix24.detachError"));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActivation = async (enabled: boolean) => {
    if (enabled) {
      await attachToProject();
      return;
    }
    await detachFromProject();
  };

  const handleSyncFunnel = async (categoryId: number) => {
    try {
      setBusy(true);
      const syncedStages = await syncBitrixFunnel({
        projectId: project.id,
        categoryId,
      });
      setStages(Array.isArray(syncedStages) ? syncedStages : []);
      toast.success(t("admin.bitrix24.funnelSynced"));
    } catch (error) {
      console.error(error);
      toast.error(t("admin.bitrix24.syncError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/5">
      <div className="flex flex-1 items-center gap-4">
        <Switch
          checked={isConnected}
          onCheckedChange={handleToggleActivation}
          disabled={loadingData || busy}
        />
        <div className="flex flex-col">
          <span className="mb-1 text-sm font-medium leading-none">
            {project.name}
          </span>
          <div className="flex items-center gap-2">
            {loadingData ? (
              <Skeleton className="h-3 w-24 rounded-md" aria-hidden />
            ) : isConnected ? (
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
            if (open && categories.length === 0) {
              void fetchState();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              disabled={!isConnected}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{project.name}</DialogTitle>
              <DialogDescription>
                {t("admin.bitrix24.configureProjectDesc")}
              </DialogDescription>
            </DialogHeader>

            {loadingData ? (
              <div className="grid gap-4 py-4 text-left">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-3 w-[min(100%,280px)]" />
              </div>
            ) : (
              <div className="grid gap-4 py-4 text-left">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("admin.bitrix24.funnel")}
                  </label>
                  <Select
                    value={
                      typeof selectedCategoryId === "number"
                        ? String(selectedCategoryId)
                        : ""
                    }
                    onValueChange={(value) => {
                      const next = value ? Number(value) : null;
                      setSelectedCategoryId(next);
                      if (syncTimeoutRef.current) {
                        window.clearTimeout(syncTimeoutRef.current);
                      }
                      if (typeof next === "number") {
                        syncTimeoutRef.current = window.setTimeout(
                          () => void handleSyncFunnel(next),
                          500,
                        );
                      }
                    }}
                    disabled={busy}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("admin.bitrix24.selectFunnel")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={String(category.id)}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {busy
                      ? t("common.saving")
                      : stages.length > 0
                        ? `${stages.length} ${t("admin.bitrix24.statusesSynced")}`
                        : t("admin.bitrix24.selectFunnelDesc")}
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                {t("common.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
