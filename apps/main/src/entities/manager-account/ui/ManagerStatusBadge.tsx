import { Badge } from "@gridix/ui";
import { useLanguage } from "@/contexts/LanguageContext";

interface ManagerStatusBadgeProps {
  status: string;
}

export const ManagerStatusBadge = ({ status }: ManagerStatusBadgeProps) => {
  const { t } = useLanguage();

  switch (status) {
    case "active":
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          {t("managerAccounts.statusActive")}
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary">{t("managerAccounts.statusPending")}</Badge>
      );
    case "suspended":
      return (
        <Badge variant="destructive">
          {t("managerAccounts.statusSuspended")}
        </Badge>
      );
    case "expired":
      return (
        <Badge variant="outline" className="text-red-600">
          {t("managerAccounts.statusExpired")}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
