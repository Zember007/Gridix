import { AmoCRMProjectList } from "@/features/admin-integrations/amocrm-project-config";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@gridix/ui";
import { CRMConnection } from "@/features/admin-integrations/model/useAmoCRMConnection";

type AmoCRMProjectsDialogProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  connection: CRMConnection | null;
  t: (key: string) => string;
};

export const AmoCRMProjectsDialog = ({
  open,
  onOpenChange,
  connection,
  t,
}: AmoCRMProjectsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{t("admin.projectsConfig")}</DialogTitle>
          <DialogDescription>
            {t("amocrm.globalConnectionInfo")}
          </DialogDescription>
        </DialogHeader>

        {connection && (
          <AmoCRMProjectList connection={connection} open={open} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
