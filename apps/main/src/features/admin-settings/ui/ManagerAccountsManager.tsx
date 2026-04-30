import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@gridix/ui";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type ManagerAccount,
  fetchManagerAccounts,
  suspendManager,
  activateManager,
  removeManager,
  ManagerCard,
  ManagerEmptyState,
} from "@/entities/manager-account";
import {
  useInviteManager,
  InviteManagerDialog,
} from "@/features/invite-manager";
import {
  useManageAccess,
  ManageAccessDialog,
} from "@/features/manage-manager-access";

const ManagerAccountsManager = ({ developerId }: { developerId: string }) => {
  const { t } = useLanguage();
  const [managers, setManagers] = useState<ManagerAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const loadManagerData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchManagerAccounts(developerId);
      setManagers(data);
    } catch (error) {
      console.error("Error loading manager data:", error);
      toast.error(t("managerAccounts.errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [developerId, t]);

  useEffect(() => {
    loadManagerData();
  }, [loadManagerData]);

  const invite = useInviteManager({ developerId, onSuccess: loadManagerData });
  const access = useManageAccess({ developerId });

  const handleSuspend = async (managerId: string) => {
    try {
      await suspendManager(managerId);
      toast.success(t("managerAccounts.managerSuspended"));
      loadManagerData();
    } catch (error) {
      console.error("Error suspending manager:", error);
      toast.error(t("managerAccounts.errorSuspending"));
    }
  };

  const handleActivate = async (managerId: string) => {
    try {
      await activateManager(managerId);
      toast.success(t("managerAccounts.managerActivated"));
      loadManagerData();
    } catch (error) {
      console.error("Error activating manager:", error);
      toast.error(t("managerAccounts.errorActivating"));
    }
  };

  const handleRemove = async (managerId: string) => {
    try {
      await removeManager(managerId);
      toast.success(t("managerAccounts.managerRemoved"));
      loadManagerData();
    } catch (error) {
      console.error("Error removing manager:", error);
      toast.error(t("managerAccounts.errorRemoving"));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-44 shrink-0" />
        </div>
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <Skeleton className="mb-2 h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-100 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-52 max-w-full" />
                  </div>
                </div>
                <Skeleton className="h-9 w-28" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-medium">{t("managerAccounts.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("managerAccounts.description")}
          </p>
        </div>
        <InviteManagerDialog {...invite} />
      </div>

      {managers.length > 0 && (
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle>{t("managerAccounts.activeManagers")}</CardTitle>
            <CardDescription>
              {t("managerAccounts.activeManagersDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <div className="space-y-4">
              {managers.map((manager) => (
                <ManagerCard
                  key={manager.id}
                  manager={manager}
                  onSuspend={handleSuspend}
                  onActivate={handleActivate}
                  onRemove={handleRemove}
                  onManageAccess={access.openForManager}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {managers.length === 0 && (
        <ManagerEmptyState onAddManager={() => invite.setIsOpen(true)} />
      )}

      <ManageAccessDialog {...access} />
    </div>
  );
};

export default ManagerAccountsManager;
