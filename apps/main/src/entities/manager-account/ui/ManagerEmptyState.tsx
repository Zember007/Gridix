import { Button } from "@gridix/ui";
import { Card, CardContent } from "@gridix/ui";
import { Plus, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ManagerEmptyStateProps {
  onAddManager: () => void;
}

export const ManagerEmptyState = ({ onAddManager }: ManagerEmptyStateProps) => {
  const { t } = useLanguage();

  return (
    <Card>
      <CardContent className="py-12 text-center">
        <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-medium">
          {t("managerAccounts.noManagers")}
        </h3>
        <p className="mb-4 text-muted-foreground">
          {t("managerAccounts.noManagersDesc")}
        </p>
        <Button onClick={onAddManager}>
          <Plus className="mr-2 h-4 w-4" />
          {t("managerAccounts.addFirstManager")}
        </Button>
      </CardContent>
    </Card>
  );
};
