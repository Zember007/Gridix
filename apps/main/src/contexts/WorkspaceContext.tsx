import type { ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  type WorkspaceOption,
  WorkspaceProvider as WorkspaceProviderCore,
  useWorkspace,
} from "@gridix/utils/react";

export type { WorkspaceOption };
export { useWorkspace };

interface WorkspaceProviderProps {
  children: ReactNode;
}

const LEGACY_STORAGE_KEY = "gridix_active_workspace_id";

export const WorkspaceProvider = ({ children }: WorkspaceProviderProps) => {
  const { userRole, isManager } = useUserRole();
  const { t } = useLanguage();

  const reloadKey = `${userRole.type}:${isManager}:${JSON.stringify(userRole.managerData ?? [])}:${t(
    "workspace.myWorkspace",
  )}`;

  return (
    <WorkspaceProviderCore
      type="developer"
      storageKey="gridix_active_workspace_id:developer"
      migrateFromStorageKey={LEGACY_STORAGE_KEY}
      reloadKey={reloadKey}
      autoSelectFirst={userRole.type === "manager"}
      loadWorkspaces={async () => {
        if (userRole.type === "loading") return [];

        const workspaces: WorkspaceOption[] = [];

        // Only developers have an "own" workspace.
        if (userRole.type === "developer") {
          workspaces.push({
            id: null,
            label: t("workspace.myWorkspace"),
            type: "owner",
          });
        }

        if (isManager && userRole.managerData) {
          for (const managerData of userRole.managerData) {
            workspaces.push({
              id: managerData.developer_id,
              label:
                managerData.developer_profile?.company_name ||
                managerData.developer_profile?.full_name ||
                "Workspace",
              type: "manager",
              developerInfo: managerData.developer_profile,
            });
          }
        }

        return workspaces;
      }}
    >
      {children}
    </WorkspaceProviderCore>
  );
};
