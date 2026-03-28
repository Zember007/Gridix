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

  const reloadKey = `${userRole.type}:${isManager}:${JSON.stringify(userRole.managerData ?? [])}:${JSON.stringify(userRole.demoManagerData ?? [])}:${t(
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

        if (userRole.type === "developer" && userRole.demoManagerData) {
          for (const demo of userRole.demoManagerData) {
            workspaces.push({
              id: demo.developer_id,
              label:
                demo.developer_profile?.company_name ||
                demo.developer_profile?.full_name ||
                "Demo Workspace",
              type: "manager",
              developerInfo: demo.developer_profile,
            });
          }
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
