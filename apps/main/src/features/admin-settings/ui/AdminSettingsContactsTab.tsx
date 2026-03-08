import ManagerAccountsManager from "@/components/admin/ManagerAccountsManager";
import type { ManagerRole } from "@/hooks/useUserRole";

type AdminSettingsContactsTabProps = {
  isManagerMode: boolean;
  developerId?: string;
  userProfileId?: string;
  managerData?: ManagerRole[];
};

export const AdminSettingsContactsTab = ({
  isManagerMode,
  developerId,
  userProfileId,
  managerData,
}: AdminSettingsContactsTabProps) => {
  if (!isManagerMode) {
    return (
      <ManagerAccountsManager
        developerId={developerId || userProfileId || ""}
      />
    );
  }

  return (
    <div className="py-8 text-center">
      <p className="text-muted-foreground">
        Managing managers is only available to the account owner
      </p>

      {managerData && managerData.length > 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          <p>Ask owner of the account to add you as a manager</p>
          <ul className="mt-1 space-y-1">
            {managerData.map((data) => (
              <li key={data.id}>
                • {data.developer_profile?.full_name} (
                {data.developer_profile?.company_name})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
