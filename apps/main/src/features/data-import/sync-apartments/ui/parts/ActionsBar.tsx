import { Button } from "@gridix/ui";

export function ActionsBar({
  t,
  onComplete,
  handleSync,
  isValid,
  isSyncing,
  admin,
}: {
  t: any;
  onComplete: () => void;
  handleSync: () => void | Promise<void>;
  isValid: boolean;
  isSyncing: boolean;
  admin: { primary: string; primaryHover: string };
}) {
  return (
    <div className="flex justify-end gap-4">
      <Button variant="outline" onClick={onComplete}>
        {t("common.cancel") || "Отмена"}
      </Button>
      <Button
        onClick={handleSync}
        disabled={!isValid || isSyncing}
        className={`${admin.primary} ${admin.primaryHover}`}
      >
        {isSyncing ? t("excel.sync.syncing") : t("excel.sync.syncButton")}
      </Button>
    </div>
  );
}
