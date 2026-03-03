import { Button } from "@gridix/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@gridix/ui";
import {
  Mail,
  Phone,
  User,
  UserMinus,
  UserCheck,
  UserX,
  Settings,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ManagerAccount } from "../model/types";
import { ManagerStatusBadge } from "./ManagerStatusBadge";

interface ManagerCardProps {
  manager: ManagerAccount;
  onSuspend: (managerId: string) => void;
  onActivate: (managerId: string) => void;
  onRemove: (managerId: string) => void;
  onManageAccess: (manager: ManagerAccount) => void;
}

export const ManagerCard = ({
  manager,
  onSuspend,
  onActivate,
  onRemove,
  onManageAccess,
}: ManagerCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="font-medium">{manager.full_name}</h4>
            <ManagerStatusBadge status={manager.status} />
          </div>
          <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3" />
              <span>{manager.email}</span>
            </div>
            {manager.phone && (
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>{manager.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onManageAccess(manager)}
        >
          <Settings className="mr-1 h-4 w-4" />
          {t("workspace.manageAccess")}
        </Button>

        {manager.status === "active" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSuspend(manager.id)}
          >
            <UserX className="mr-1 h-4 w-4" />
            {t("managerAccounts.suspend")}
          </Button>
        ) : manager.status === "suspended" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onActivate(manager.id)}
          >
            <UserCheck className="mr-1 h-4 w-4" />
            {t("managerAccounts.activate")}
          </Button>
        ) : null}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <UserMinus className="mr-1 h-4 w-4" />
              {t("managerAccounts.remove")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("managerAccounts.confirmRemove")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("managerAccounts.confirmRemoveDesc", {
                  name: manager.full_name,
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemove(manager.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("managerAccounts.remove")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
