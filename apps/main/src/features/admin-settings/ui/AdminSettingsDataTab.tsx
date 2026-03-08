import { Button } from "@gridix/ui";
import { Database } from "lucide-react";

export type AdminSettingsDataTabProps = {
  exportingBackup: boolean;
  resettingSettings: boolean;
  onExportBackup: () => void;
  onResetSettings: () => void;
  t: (key: string, vars?: Record<string, unknown>) => string;
};

export function AdminSettingsDataTab(props: AdminSettingsDataTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-xl border p-5">
        <div className="font-semibold">
          {props.t("adminSettings.backupTitle")}
        </div>
        <div className="text-sm text-muted-foreground">
          {props.t("adminSettings.backupDesc")}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={props.onExportBackup}
          disabled={props.exportingBackup}
        >
          <Database className="mr-2 h-4 w-4" />
          {props.exportingBackup
            ? props.t("adminSettings.saving")
            : props.t("adminSettings.downloadBackup")}
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <div className="font-semibold text-destructive">
          {props.t("adminSettings.dangerZone")}
        </div>
        <div className="text-sm text-muted-foreground">
          {props.t("adminSettings.resetDesc")}
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={props.onResetSettings}
          disabled={props.resettingSettings}
        >
          {props.resettingSettings
            ? props.t("adminSettings.saving")
            : props.t("adminSettings.resetButton")}
        </Button>
      </div>
    </div>
  );
}
